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
const { query, testConnection } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3001;

// WebAuthn configuration
const rpName = process.env.WEBAUTHN_RP_NAME || "Modern Auth Demo";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

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

// Trust proxy for rate limiting
app.set('trust proxy', 1);

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
        authenticatorAttachment: undefined, // Allow both platform and cross-platform
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

// PART 1B: WebAuthn Passkeys (DB-backed, spec-aligned endpoints)

// Password registration (for MFA with passkey)
app.post('/api/auth/password/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, auth_type: 'password' });
    await query(`UPDATE users SET password_hash=$2 WHERE id=$1`, [user.id, password_hash]);

    res.json({ success: true });
  } catch (e) {
    console.error('password/register error:', e);
    res.status(500).json({ error: 'Failed to register password user' });
  }
});

// Password login (phase 1 of MFA)
app.post('/api/auth/password/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rows } = await query(`SELECT password_hash FROM users WHERE id=$1`, [user.id]);
    const ok = rows[0]?.password_hash && await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const pendingId = uuidv4();
    await query(`
      INSERT INTO auth_sessions (id, user_id, session_token, auth_type, created_at, expires_at, is_active)
      VALUES ($1,$2,$3,'password',NOW(), NOW() + INTERVAL '5 minutes', true)
    `, [pendingId, user.id, pendingId]);

    res.json({ success: true, passwordSessionId: pendingId, requirePasskey: true });
  } catch (e) {
    console.error('password/login error:', e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Begin registration (create options)
app.post('/api/auth/register/begin', async (req, res) => {
  try {
    const { username, displayName, attachmentPreference } = req.body; // username is email
    if (!username || !displayName) {
      return res.status(400).json({ error: 'username and displayName are required' });
    }

    // Ensure user exists (create if not)
    let user = await User.findByEmail(username);
    if (!user) {
      user = await User.create({ username: displayName, email: username, auth_type: 'passkey' });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.email,
      userDisplayName: user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment:
          attachmentPreference === 'platform'
            ? 'platform'
            : attachmentPreference === 'cross-platform'
            ? 'cross-platform'
            : undefined,
      },
      excludeCredentials: [],
    });

    // Store challenge in DB as bytea
    const challengeBuf = Buffer.from(options.challenge, 'base64url');
    await query(
      `INSERT INTO auth_challenges (challenge, user_id, challenge_type, expires_at)
       VALUES ($1,$2,'registration', NOW() + INTERVAL '5 minutes')`,
      [challengeBuf, user.id]
    );

    res.json(options);
  } catch (e) {
    console.error('register/begin error:', e);
    res.status(500).json({ error: 'Failed to begin registration' });
  }
});

// Complete registration (verify and persist credential)
app.post('/api/auth/register/complete', async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;
    if (!credential || !expectedChallenge) {
      return res.status(400).json({ error: 'Missing credential or expectedChallenge' });
    }

    const challengeBuf = Buffer.from(expectedChallenge, 'base64url');
    const { rows } = await query(
      `SELECT * FROM auth_challenges
       WHERE challenge=$1 AND challenge_type='registration' AND is_used=false AND expires_at>NOW()`,
      [challengeBuf]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }
    const challengeRow = rows[0];

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!verification.verified) {
      return res.status(400).json({ error: 'Registration verification failed' });
    }

    // Persist new credential
    // Debug logging: Public key and credential ID (safe to log; DO NOT attempt private key)
    try {
      const credIdB64 = Buffer.from(verification.registrationInfo.credentialID).toString('base64url');
      const pubKeyB64 = Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64url');
      console.log('🔐 WebAuthn Registration - Storing public key');
      console.log({
        userId: challengeRow.user_id,
        credentialId_base64url: credIdB64,
        publicKey_COSE_base64url: pubKeyB64,
        initialCounter: verification.registrationInfo.counter,
      });
      console.log('ℹ️ Private key never leaves the authenticator (TPM/Secure Enclave/security key). It is non-exportable and cannot be logged.');
    } catch (_) {}

    await WebAuthnCredential.create({
      user_id: challengeRow.user_id,
      credential_id: verification.registrationInfo.credentialID,
      public_key: verification.registrationInfo.credentialPublicKey,
      counter: verification.registrationInfo.counter,
      transports: credential.response?.transports || [],
    });

    // Mark challenge as used
    await query(`UPDATE auth_challenges SET is_used=true WHERE id=$1`, [challengeRow.id]);

    // Return token and user info
    const createdUser = await User.findById(challengeRow.user_id);
    const token = jwt.sign({ userId: challengeRow.user_id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.json({ success: true, token, user: createdUser && { id: createdUser.id, username: createdUser.username, email: createdUser.email } });
  } catch (e) {
    console.error('register/complete error:', e);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// Begin login (create options)
app.post('/api/auth/login/begin', async (req, res) => {
  try {
    const { username } = req.body; // optional email

    if (username) {
      // Username provided: return options scoped to that user's credentials
      const user = await User.findByEmail(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const creds = await WebAuthnCredential.findByUserId(user.id);
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: creds.map((c) => ({
          id: c.credential_id,
          type: 'public-key',
          transports: c.transports || [],
        })),
        userVerification: 'required',
      });

      const challengeBuf = Buffer.from(options.challenge, 'base64url');
      await query(
        `INSERT INTO auth_challenges (challenge, user_id, challenge_type, expires_at)
         VALUES ($1,$2,'authentication', NOW() + INTERVAL '5 minutes')`,
        [challengeBuf, user.id]
      );

      return res.json({ ...options, mode: 'username' });
    }

    // No username: usernameless/conditional UI. Empty allowCredentials to let browser discover local creds
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [],
      userVerification: 'required',
    });

    const challengeBuf = Buffer.from(options.challenge, 'base64url');
    await query(
      `INSERT INTO auth_challenges (challenge, user_id, challenge_type, expires_at)
       VALUES ($1,NULL,'authentication', NOW() + INTERVAL '5 minutes')`,
      [challengeBuf]
    );

    return res.json({ ...options, mode: 'usernameless' });
  } catch (e) {
    console.error('login/begin error:', e);
    res.status(500).json({ error: 'Failed to begin login' });
  }
});

// Complete login (verify assertion)
app.post('/api/auth/login/complete', async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;
    if (!credential || !expectedChallenge) {
      return res.status(400).json({ error: 'Missing credential or expectedChallenge' });
    }

    const challengeBuf = Buffer.from(expectedChallenge, 'base64url');
    const { rows } = await query(
      `SELECT * FROM auth_challenges
       WHERE challenge=$1 AND challenge_type='authentication' AND is_used=false AND expires_at>NOW()`,
      [challengeBuf]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }
    const challengeRow = rows[0];

    // Look up stored authenticator by credentialId
    const credentialIdBuf = Buffer.from(credential.id, 'base64url');
    const stored = await WebAuthnCredential.findByCredentialId(credentialIdBuf);
    if (!stored) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: stored.credential_id,
        credentialPublicKey: stored.public_key,
        counter: stored.counter,
      },
    });
    if (!verification.verified) {
      return res.status(400).json({ error: 'Authentication verification failed' });
    }

    // Update counter and last used
    // Debug logging: signature and counters (no private key access)
    try {
      const credIdB64 = Buffer.from(credential.id, 'base64url').toString('base64url');
      const sigB64 = credential?.response?.signature || '(not provided)';
      console.log('🔑 WebAuthn Authentication - Verifying signature with stored public key');
      console.log({
        userId: stored.user_id,
        credentialId_base64url: credIdB64,
        newCounter: verification.authenticationInfo.newCounter,
        signature_base64url: sigB64,
      });
      console.log('ℹ️ Signature was created inside the authenticator using the non-exportable private key.');
    } catch (_) {}

    await WebAuthnCredential.updateCounter(stored.credential_id, verification.authenticationInfo.newCounter);
    await User.updateLastLogin(stored.user_id);
    await query(`UPDATE auth_challenges SET is_used=true WHERE id=$1`, [challengeRow.id]);

    const loggedInUser = await User.findById(stored.user_id);
    const token = jwt.sign({ userId: stored.user_id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.json({ success: true, token, user: loggedInUser && { id: loggedInUser.id, username: loggedInUser.username, email: loggedInUser.email } });
  } catch (e) {
    console.error('login/complete error:', e);
    res.status(500).json({ error: 'Failed to complete login' });
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
