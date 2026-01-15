# Modern Authentication System

A comprehensive demonstration of modern authentication technologies including WebAuthn/passkeys, step-up authentication for banking, and conversion analytics tracking.

## 🎯 Assignment Overview

This project implements all three parts of the authentication assignment:

### Part 1: WebAuthn / Passkeys Implementation

- ✅ Complete WebAuthn registration and authentication flow
- ✅ React frontend with passkey support
- ✅ Node.js backend with @simplewebauthn/server
- ✅ Phishing-resistant authentication
- ✅ Cross-device credential support

### Part 2: Step-up Authentication for Banks

- ✅ PSD3 compliant transaction monitoring
- ✅ Automatic step-up for transactions > €150
- ✅ OTP-based verification system
- ✅ Risk-based authentication flow

### Part 3: Conversion Analytics

- ✅ Password vs Passkey conversion tracking
- ✅ Real-time analytics dashboard
- ✅ Conversion rate calculations
- ✅ Visual charts and metrics

## 🚀 Features

### Authentication

- **WebAuthn/Passkeys**: Modern, phishing-resistant authentication
- **Password Fallback**: Traditional password authentication (demo only)
- **Biometric Support**: Works with fingerprint, face ID, etc.
- **Cross-Platform**: Works on desktop and mobile devices

### Banking Features

- **Step-up Authentication**: Automatic for high-value transactions
- **PSD3 Compliance**: EU banking regulation compliance
- **Transaction Monitoring**: Real-time transaction analysis
- **OTP Verification**: Secure one-time password system

### Analytics

- **Conversion Tracking**: Password vs Passkey comparison
- **Real-time Metrics**: Live dashboard updates
- **Visual Charts**: Bar charts and pie charts
- **Performance Insights**: Detailed conversion analysis

## 🛠️ Technology Stack

### Backend

- **Node.js** with Express.js
- **@simplewebauthn/server** for WebAuthn implementation
- **JWT** for session management
- **Rate limiting** and security headers
- **In-memory storage** (demo purposes)

### Frontend

- **React 18** with modern hooks
- **@simplewebauthn/browser** for WebAuthn client
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Modern CSS** with dark theme

## 📦 Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- Modern browser with WebAuthn support

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/JOELNATHAN544/modern-auth.git
   cd modern-auth
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install

   # Return to root
   cd ..
   ```

3. **Start the development servers**

   ```bash
   # Start both server and client
   npm run dev
   ```
   ```baah
   # Or start them separately:
   npm run server  # Backend on port 3001
   npm run client  # Frontend on port 3000
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🎮 Usage Guide

### 1. Authentication Flow

1. **Register**: Click "Create Account" and choose "Passkey"
2. **Create Passkey**: Follow browser prompts to create a passkey
3. **Login**: Use your passkey to authenticate
4. **Dashboard**: View your account and security status

### 2. Transaction Testing

1. **Navigate to Transactions**: Use the navigation menu
2. **Create Transaction**: Enter amount and description
3. **Test Step-up**: Try amounts over €150 to trigger step-up auth
4. **Verify OTP**: Check console for demo OTP codes

### 3. Analytics Dashboard

1. **View Analytics**: Navigate to the Analytics page
2. **Monitor Conversions**: See password vs passkey metrics
3. **Track Performance**: Real-time conversion rates
4. **Step-up Metrics**: Monitor authentication flows

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-here
```

### WebAuthn Configuration

The system is configured for localhost development. For production:

1. Update `rpID` in `server/index.js`
2. Set proper origins and domains
3. Use HTTPS (required for WebAuthn)
4. Configure proper CORS settings

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register/options` - Generate registration options
- `POST /api/auth/register/verify` - Verify registration
- `POST /api/auth/login/options` - Generate authentication options
- `POST /api/auth/login/verify` - Verify authentication

### Transactions

- `POST /api/transactions` - Create transaction
- `POST /api/transactions/stepup` - Verify step-up authentication

### Analytics

- `GET /api/analytics/conversion` - Get conversion metrics

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API protection
- **CORS**: Cross-origin protection
- **JWT**: Secure session management
- **WebAuthn**: Phishing-resistant auth
- **Input Validation**: Server-side validation

## 📈 Analytics Implementation

### Conversion Tracking

- **SIGNUP_STARTED**: Tracks when users begin registration
- **SIGNUP_COMPLETED**: Tracks successful registrations
- **Conversion Rate**: (Completed / Started) × 100
- **Delta Calculation**: Passkey rate - Password rate

### Metrics Collected

- Password authentication attempts
- Passkey authentication attempts
- Step-up authentication triggers
- Transaction success rates
- Real-time conversion data

## 🎨 UI/UX Features

- **Dark Theme**: Modern, eye-friendly interface
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Smooth user experience
- **Toast Notifications**: User feedback
- **Interactive Charts**: Data visualization
- **Accessibility**: Keyboard navigation support

## 🧪 Testing

### Manual Testing Scenarios

1. **Passkey Registration**
   - Create new account with passkey
   - Verify biometric authentication works
   - Test cross-device functionality

2. **Step-up Authentication**
   - Create transaction < €150 (should succeed)
   - Create transaction > €150 (should trigger step-up)
   - Verify OTP authentication

3. **Analytics Tracking**
   - Register multiple users
   - Monitor conversion rates
   - Verify real-time updates

## 🚨 Important Notes

### Demo Limitations

- **In-memory Storage**: Data is lost on server restart
- **Demo OTP**: Check console for OTP codes
- **Localhost Only**: WebAuthn requires HTTPS in production
- **Password Auth**: Not fully implemented (demo only)

### Production Considerations

- Use proper database (PostgreSQL, MongoDB)
- Implement proper OTP delivery (SMS/Email)
- Add comprehensive error handling
- Implement proper logging
- Add monitoring and alerting
- Use proper SSL certificates

## 📚 Learning Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)
- [PSD3 Regulations](https://www.europeanpaymentscouncil.eu/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FIDO Alliance for WebAuthn standards
- SimpleWebAuthn for the excellent library
- React and Node.js communities
- Modern authentication best practices

---

***Note***: This is a demonstration project for educational purposes. For production use, implement proper security measures, error handling, and follow industry best practices.
