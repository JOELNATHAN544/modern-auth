const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// WebAuthn configuration
const rpName = 'Modern Auth Demo';
const rpID = process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000';

// In-memory storage (in production, use a proper database)
const users = new Map();
const challenges = new Map();
const analytics = {
  signupStarted: { password: 0, passkey: 0 },
  signupCompleted: { password: 0, passkey: 0 },
  transactions: [],
  stepUpAuth: { triggered: 0, completed: 0 }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

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
  skip: (req) => req.headers['x-forwarded-for'] === undefined
});
app.use(limiter);

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webauthn: {
      rpID,
      origin,
      rpName
    }
  });
});

// Analytics tracking middleware
app.use((req, res, next) => {
  if (req.path === '/api/auth/signup' && req.method === 'POST') {
    const authType = req.body.authType || 'password';
    analytics.signupStarted[authType]++;
  }
  if (req.path === '/api/auth/register/options' && req.method === 'POST') {
    analytics.signupStarted.passkey++;
  }
  next();
});

// PART 1: WebAuthn Registration
app.post('/api/auth/register/options', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = {
      id: uuidv4(),
      username,
      email,
      credentials: [],
      createdAt: new Date()
    };

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.username,
      userDisplayName: user.username,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
        // Removed platform-only restriction to allow cross-platform authenticators
      }
    });

    // Store challenge and user temporarily
    challenges.set(options.challenge, {
      user,
      type: 'registration',
      createdAt: new Date()
    });

    res.json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

app.post('/api/auth/register/verify', async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;

    const expectedChallengeData = challenges.get(expectedChallenge);
    if (!expectedChallengeData || expectedChallengeData.type !== 'registration') {
      return res.status(400).json({ error: 'Invalid challenge' });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const user = expectedChallengeData.user;
      user.credentials.push({
        id: verification.registrationInfo.credentialID,
        publicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        transports: credential.response.transports || []
      });

      users.set(user.email, user);
      challenges.delete(expectedChallenge);

      // Track successful passkey registration
      analytics.signupCompleted.passkey++;

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true, 
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } else {
      res.status(400).json({ error: 'Registration verification failed' });
    }
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// PART 1: WebAuthn Authentication
app.post('/api/auth/login/options', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = users.get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: cred.transports
      })),
      userVerification: 'preferred'
    });

    challenges.set(options.challenge, {
      user,
      type: 'authentication',
      createdAt: new Date()
    });

    res.json(options);
  } catch (error) {
    console.error('Authentication options error:', error);
    res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

app.post('/api/auth/login/verify', async (req, res) => {
  try {
    const { credential, expectedChallenge } = req.body;

    const expectedChallengeData = challenges.get(expectedChallenge);
    if (!expectedChallengeData || expectedChallengeData.type !== 'authentication') {
      return res.status(400).json({ error: 'Invalid challenge' });
    }

    const user = expectedChallengeData.user;
    const userCredential = user.credentials.find(
      cred => cred.id.toString() === credential.id
    );

    if (!userCredential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: userCredential.publicKey,
        credentialID: userCredential.id,
        counter: userCredential.counter
      }
    });

    if (verification.verified) {
      // Update counter
      userCredential.counter = verification.authenticationInfo.newCounter;
      users.set(user.email, user);
      challenges.delete(expectedChallenge);

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true, 
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// PART 2: Step-up Authentication for Banks
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, description, userId } = req.body;
    
    if (!amount || !description || !userId) {
      return res.status(400).json({ error: 'Amount, description, and userId are required' });
    }

    const transaction = {
      id: uuidv4(),
      amount: parseFloat(amount),
      description,
      userId,
      timestamp: new Date(),
      status: 'pending'
    };

    // PSD3 threshold check (€150)
    if (transaction.amount > 150) {
      analytics.stepUpAuth.triggered++;
      
      // Generate OTP for step-up authentication
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      challenges.set(otp, {
        transaction,
        type: 'stepup',
        otp,
        expiry: otpExpiry,
        createdAt: new Date()
      });

      // In a real implementation, send OTP via SMS/email
      console.log(`🔐 OTP for transaction ${transaction.id}: ${otp}`);
      console.log(`📱 Demo OTP: ${otp} (valid for 5 minutes)`);

      res.json({
        requiresStepUp: true,
        transactionId: transaction.id,
        message: 'Step-up authentication required for transactions over €150'
      });
    } else {
      // Transaction proceeds without step-up
      transaction.status = 'completed';
      analytics.transactions.push(transaction);
      
      res.json({
        requiresStepUp: false,
        transaction: transaction,
        message: 'Transaction completed successfully'
      });
    }
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

app.post('/api/transactions/stepup', async (req, res) => {
  try {
    const { otp, transactionId } = req.body;
    
    const challengeData = challenges.get(otp);
    if (!challengeData || challengeData.type !== 'stepup') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (challengeData.transaction.id !== transactionId) {
      return res.status(400).json({ error: 'Transaction ID mismatch' });
    }

    if (new Date() > challengeData.expiry) {
      challenges.delete(otp);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // OTP verified successfully
    const transaction = challengeData.transaction;
    transaction.status = 'completed';
    analytics.transactions.push(transaction);
    analytics.stepUpAuth.completed++;
    
    challenges.delete(otp);

    res.json({
      success: true,
      transaction: transaction,
      message: 'Step-up authentication successful, transaction completed'
    });
  } catch (error) {
    console.error('Step-up verification error:', error);
    res.status(500).json({ error: 'Failed to verify step-up authentication' });
  }
});

// GET endpoint for transaction history
app.get('/api/transactions', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (userId) {
      // Get transactions for specific user
      const userTransactions = analytics.transactions.filter(t => t.userId === userId);
      res.json(userTransactions);
    } else {
      // Get all transactions (for admin/analytics purposes)
      res.json(analytics.transactions);
    }
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// PART 3: Analytics and Conversion Tracking
app.get('/api/analytics/conversion', (req, res) => {
  const passwordConversion = analytics.signupStarted.password > 0 
    ? (analytics.signupCompleted.password / analytics.signupStarted.password) * 100 
    : 0;
  
  const passkeyConversion = analytics.signupStarted.passkey > 0 
    ? (analytics.signupCompleted.passkey / analytics.signupStarted.passkey) * 100 
    : 0;
  
  const conversionDelta = passkeyConversion - passwordConversion;

  res.json({
    password: {
      started: analytics.signupStarted.password,
      completed: analytics.signupCompleted.password,
      conversionRate: passwordConversion.toFixed(2) + '%'
    },
    passkey: {
      started: analytics.signupStarted.passkey,
      completed: analytics.signupCompleted.passkey,
      conversionRate: passkeyConversion.toFixed(2) + '%'
    },
    delta: {
      percentage: conversionDelta.toFixed(2) + '%',
      improvement: conversionDelta > 0 ? 'Passkeys improve conversion' : 'Passkeys reduce conversion'
    },
    stepUpAuth: analytics.stepUpAuth,
    totalTransactions: analytics.transactions.length
  });
});

// Clean up expired challenges every hour
cron.schedule('0 * * * *', () => {
  const now = new Date();
  for (const [key, challenge] of challenges.entries()) {
    if (challenge.expiry && now > challenge.expiry) {
      challenges.delete(key);
    }
  }
  console.log('Cleaned up expired challenges');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebAuthn RP ID: ${rpID}`);
  console.log(`Origin: ${origin}`);
});
