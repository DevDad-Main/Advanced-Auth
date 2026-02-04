# Advanced Authentication Server

A secure, modular Node.js authentication template with advanced security features.

## Features

🔐 **Security First**
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (12 salt rounds)
- Email verification via OTP
- Rate limiting with Redis
- Input sanitization & validation
- XSS prevention
- Security headers with Helmet

🏗️ **Modern Architecture**
- Modular MVC structure
- ES6 modules
- Redis for session management
- MongoDB with Mongoose
- Comprehensive logging
- Graceful error handling

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-registration` - Verify email with OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## Environment Variables

Copy `.env.example` to `.env` and configure:

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
```

## Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Blocks XSS and injection attempts
- **Password Policies**: Configurable security requirements
- **Session Management**: Secure Redis-based sessions
- **CORS Protection**: Configurable origin restrictions

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
├── lib/             # External libraries
└── app.js           # Express app setup
```

Perfect for developers who need a secure, production-ready authentication foundation for their applications.