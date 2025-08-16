const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { v4: uuidv4 } = require("uuid");
const { v5: uuidv5 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

// Import database models
const User = require("./models/User");
const Transaction = require("./models/Transaction");
const WebAuthnCredential = require("./models/WebAuthnCredential");
const { testConnection } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3001;

// WebAuthn configuration
const rpName = "Modern Auth Demo";
const rpID =
  process.env.NODE_ENV === "production" ? "yourdomain.com" : "localhost";
const origin =
  process.env.NODE_ENV === "production"
    ? "https://yourdomain.com"
    : "http://localhost:3000";

// In-memory storage for challenges only (these are temporary)
const challenges = new Map();

// Analytics tracking (will be moved to database)
const analytics = {
  signupStarted: { password: 0, passkey: 0 },
  signupCompleted: { password: 0, passkey: 0 },
  stepUpAuth: { triggered: 0, completed: 0 },
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
          ],
    credentials: true,
  })
);

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.headers["x-forwarded-for"] === undefined,
});
app.use(limiter);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    webauthn: {
      rpID,
      origin,
      rpName,
    },
  });
});

// Analytics tracking middleware
app.use((req, res, next) => {
  if (req.path === "/api/auth/signup" && req.method === "POST") {
    const authType = req.body.authType || "password";
    analytics.signupStarted[authType]++;
  }
  if (req.path === "/api/auth/register/options" && req.method === "POST") {
    analytics.signupStarted.passkey++;
  }
  next();
});

// PART 1: WebAuthn Registration
app.post("/api/auth/register/options", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      auth_type: "passkey",
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.username,
      userDisplayName: user.username,
      attestationType: "none",
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        // Removed platform-only restriction to allow cross-platform authenticators
      },
    });

    // Store challenge and user temporarily
    challenges.set(options.challenge, {
      user,
      type: "registration",
      createdAt: new Date(),
    });

    res.json(options);
  } catch (error) {
    console.error("Registration options error:", error);
    res.status(500).json({ error: "Failed to generate registration options" });
  }
});

app.post("/api/auth/register/verify", async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;

    const expectedChallengeData = challenges.get(expectedChallenge);
    if (
      !expectedChallengeData ||
      expectedChallengeData.type !== "registration"
    ) {
      return res.status(400).json({ error: "Invalid challenge" });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const user = expectedChallengeData.user;
      await WebAuthnCredential.create({
        user_id: user.id,
        credential_id: verification.registrationInfo.credentialID,
        public_key: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        transports: credential.response.transports || [],
      });

      challenges.delete(expectedChallenge);

      // Track successful passkey registration
      analytics.signupCompleted.passkey++;

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } else {
      res.status(400).json({ error: "Registration verification failed" });
    }
  } catch (error) {
    console.error("Registration verification error:", error);
    res.status(500).json({ error: "Failed to verify registration" });
  }
});

// PART 1: WebAuthn Authentication
app.post("/api/auth/login/options", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const credentials = await WebAuthnCredential.findByUserId(user.id);
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((cred) => ({
        id: cred.credential_id,
        type: "public-key",
        transports: cred.transports,
      })),
      userVerification: "preferred",
    });

    challenges.set(options.challenge, {
      user,
      type: "authentication",
      createdAt: new Date(),
    });

    res.json(options);
  } catch (error) {
    console.error("Authentication options error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate authentication options" });
  }
});

app.post("/api/auth/login/verify", async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;

    const expectedChallengeData = challenges.get(expectedChallenge);
    if (
      !expectedChallengeData ||
      expectedChallengeData.type !== "authentication"
    ) {
      return res.status(400).json({ error: "Invalid challenge" });
    }

    const user = expectedChallengeData.user;
    const userCredential = await WebAuthnCredential.findByCredentialId(
      credential.id
    );

    if (!userCredential || userCredential.user_id !== user.id) {
      return res.status(400).json({ error: "Credential not found" });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: userCredential.public_key,
        credentialID: userCredential.credential_id,
        counter: userCredential.counter,
      },
    });

    if (verification.verified) {
      // Update counter
      await WebAuthnCredential.updateCounter(
        userCredential.id,
        verification.authenticationInfo.newCounter
      );
      challenges.delete(expectedChallenge);

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } else {
      res.status(400).json({ error: "Authentication verification failed" });
    }
  } catch (error) {
    console.error("Authentication verification error:", error);
    res.status(500).json({ error: "Failed to verify authentication" });
  }
});

// PART 2: Step-up Authentication for Banks
app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, description, userId } = req.body;

    if (!amount || !description || !userId) {
      return res
        .status(400)
        .json({ error: "Amount, description, and userId are required" });
    }

    // Resolve user ID: if not a UUID, treat as demo and map to deterministic UUID
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    let resolvedUserId = userId;
    let user;
    if (!uuidRegex.test(String(userId))) {
      // Map demo/external ID to deterministic UUID and ensure user exists
      user = await User.ensureDemoUser(String(userId));
      resolvedUserId = user.id;
    } else {
      user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
    }

    console.log("Creating transaction for user:", {
      inputUserId: userId,
      resolvedUserId: user.id,
    });

    const transaction = await Transaction.create({
      user_id: resolvedUserId,
      amount: parseFloat(amount),
      description,
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    // PSD3 threshold check (€150)
    if (transaction.requires_stepup) {
      analytics.stepUpAuth.triggered++;

      // Generate OTP for step-up authentication
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      challenges.set(otp, {
        transaction,
        type: "stepup",
        otp,
        expiry: otpExpiry,
        createdAt: new Date(),
      });

      // In a real implementation, send OTP via SMS/email
      console.log(`🔐 OTP for transaction ${transaction.id}: ${otp}`);
      console.log(`📱 Demo OTP: ${otp} (valid for 5 minutes)`);

      res.json({
        requiresStepUp: true,
        transactionId: transaction.id,
        message: "Step-up authentication required for transactions over €150",
      });
    } else {
      // Transaction proceeds without step-up
      await Transaction.updateStatus(transaction.id, "completed");

      res.json({
        requiresStepUp: false,
        transaction: transaction,
        message: "Transaction completed successfully",
      });
    }
  } catch (error) {
    console.error("Transaction error:", error);
    res
      .status(500)
      .json({ error: "Failed to process transaction", message: error.message });
  }
});

app.post("/api/transactions/stepup", async (req, res) => {
  try {
    const { otp, transactionId } = req.body;

    const challengeData = challenges.get(otp);
    if (!challengeData || challengeData.type !== "stepup") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (challengeData.transaction.id !== transactionId) {
      return res.status(400).json({ error: "Transaction ID mismatch" });
    }

    if (new Date() > challengeData.expiry) {
      challenges.delete(otp);
      return res.status(400).json({ error: "OTP expired" });
    }

    // OTP verified successfully
    const transaction = challengeData.transaction;
    const updatedTransaction = await Transaction.updateStatus(
      transaction.id,
      "completed"
    );
    await Transaction.markStepupCompleted(transaction.id);
    analytics.stepUpAuth.completed++;

    challenges.delete(otp);

    res.json({
      success: true,
      transaction: updatedTransaction,
      message: "Step-up authentication successful, transaction completed",
    });
  } catch (error) {
    console.error("Step-up verification error:", error);
    res.status(500).json({ error: "Failed to verify step-up authentication" });
  }
});

// GET endpoint for transaction history
app.get("/api/transactions", async (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
      // Resolve non-UUID demo IDs
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      const resolvedUserId = uuidRegex.test(String(userId))
        ? String(userId)
        : uuidv5(String(userId), uuidv5.DNS);
      const userTransactions = await Transaction.findByUserId(resolvedUserId);
      res.json(userTransactions);
    } else {
      // Get all transactions (for admin/analytics purposes)
      const allTransactions = await Transaction.getAll();
      res.json(allTransactions);
    }
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// PART 3: Analytics and Conversion Tracking
app.get("/api/analytics/conversion", async (req, res) => {
  try {
    const passwordConversion =
      analytics.signupStarted.password > 0
        ? (analytics.signupCompleted.password /
            analytics.signupStarted.password) *
          100
        : 0;

    const passkeyConversion =
      analytics.signupStarted.passkey > 0
        ? (analytics.signupCompleted.passkey /
            analytics.signupStarted.passkey) *
          100
        : 0;

    const conversionDelta = passkeyConversion - passwordConversion;

    // Get transaction stats from database
    const transactionStats = await Transaction.getStats();

    res.json({
      password: {
        started: analytics.signupStarted.password,
        completed: analytics.signupCompleted.password,
        conversionRate: passwordConversion.toFixed(2) + "%",
      },
      passkey: {
        started: analytics.signupStarted.passkey,
        completed: analytics.signupCompleted.passkey,
        conversionRate: passkeyConversion.toFixed(2) + "%",
      },
      delta: {
        percentage: conversionDelta.toFixed(2) + "%",
        improvement:
          conversionDelta > 0
            ? "Passkeys improve conversion"
            : "Passkeys reduce conversion",
      },
      stepUpAuth: analytics.stepUpAuth,
      totalTransactions: transactionStats.total_transactions || 0,
      transactionStats: transactionStats,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Clean up expired challenges every hour
cron.schedule("0 * * * *", async () => {
  const now = new Date();
  for (const [key, challenge] of challenges.entries()) {
    if (challenge.expiry && now > challenge.expiry) {
      challenges.delete(key);
    }
  }
  console.log("Cleaned up expired challenges");
});

// Start server with database connection check
const startServer = async () => {
  try {
    // Test database connection
    console.log("🔌 Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Server will not start.");
      process.exit(1);
    }

    console.log("✅ Database connected successfully");

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔐 WebAuthn RP ID: ${rpID}`);
      console.log(`🌐 Origin: ${origin}`);
      console.log(`💾 Database: Connected`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
