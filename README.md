# Advanced Authentication System

A complete, full-stack authentication solution with secure Node.js backend and modern React frontend. Features cookie-based authentication, automatic token refresh, and enterprise-grade security.

## 🚀 Overview

This project provides a production-ready authentication system with:
- **Secure Backend**: Node.js/Express with JWT, Redis, and MongoDB
- **Modern Frontend**: React with Vite, Tailwind CSS, and cookie-based auth
- **Advanced Security**: Rate limiting, XSS protection, and automatic token rotation

## 📁 Project Structure

```
Advanced-Auth/
├── server/          # Node.js authentication backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
├── client/          # React frontend (see client/README.md)
│   ├── src/
│   │   ├── components/
│   │   └── utils/
│   └── package.json
└── README.md        # This file
```

## 🔐 Backend Features

**Security First**
- JWT-based authentication with automatic refresh tokens
- HttpOnly cookie-based sessions (XSS protection)
- Password hashing with bcrypt (12 salt rounds)
- Email verification via OTP
- Rate limiting with Redis
- Input sanitization & validation
- Security headers with Helmet
- CORS protection

**Modern Architecture**
- Modular MVC structure
- ES6 modules
- Redis for session management
- MongoDB with Mongoose
- Comprehensive logging
- Graceful error handling

## 🎨 Frontend Features

**Authentication Flow**
- User registration with email verification
- Secure cookie-based authentication
- OTP-based email verification
- Automatic token refresh via cookies

**Modern UI**
- Responsive design with Tailwind CSS
- Beautiful icons with Lucide React
- Toast notifications with react-hot-toast
- Smooth animations and transitions

## 🚀 Quick Start

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-registration` - Verify email with OTP
- `POST /api/auth/login` - User login (sets HttpOnly cookies)
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Automatic token refresh

## ⚙️ Environment Variables

### Backend (.env)

Copy `server/.env.example` to `server/.env` and configure:

```bash
# Core
PORT=3000
NODE_ENV=development
MONGO_URI=your-mongodb-url
REDIS_URL=your-redis-url
JWT_SECRET=your-super-secret-key

# Email (choose one)
MAILTRAP_API_KEY=your-mailtrap-key  # Development
RESEND_API_KEY=your-resend-key      # Production

# Security (customizable)
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_MIN_UPPERCASE=1
PASSWORD_MIN_NUMBERS=1
PASSWORD_MIN_SYMBOLS=1

# CORS
ALLOWED_ORIGINS=http://localhost:5173  # Frontend URL
```

### Frontend (.env)

Copy `client/.env.example` to `client/.env` and configure:

```bash
VITE_API_URL=http://localhost:3000  # Your backend URL
```

## 🔒 Security Features

### Backend Security
- **Rate Limiting**: Prevents brute force attacks with Redis
- **Input Sanitization**: Blocks XSS and injection attempts
- **Password Policies**: Configurable security requirements
- **Session Management**: Secure Redis-based sessions
- **CORS Protection**: Configurable origin restrictions
- **HttpOnly Cookies**: Prevents XSS attacks on tokens
- **Automatic Token Refresh**: Seamless user experience

### Frontend Security
- **HttpOnly Cookies**: No localStorage tokens, prevents XSS
- **Secure Flag**: Cookies only sent over HTTPS
- **SameSite Protection**: Prevents CSRF attacks
- **Automatic Token Rotation**: No manual token management needed

## 🔄 Authentication Flow

1. **Registration** → User fills form → Receives OTP email
2. **Email Verification** → User enters OTP → Account created
3. **Login** → User credentials → Server sets secure HttpOnly cookies
4. **Auto Refresh** → Access token expires → Backend automatically refreshes cookies
5. **Logout** → User logout → Server clears cookies

## 📚 Documentation

- **Backend**: See `server/README.md` for detailed API documentation
- **Frontend**: See `client/README.md` for React component details

## 🛠 Development

### Running Both Services

For development, run both services concurrently:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev
```

### Production Deployment

1. **Backend**: Deploy to Node.js hosting (Railway, Render, etc.)
2. **Frontend**: Build and deploy to static hosting (Vercel, Netlify)
3. **Environment**: Update `VITE_API_URL` and `ALLOWED_ORIGINS` for production

Perfect for developers who need a complete, secure, production-ready authentication system for their applications! 🚀