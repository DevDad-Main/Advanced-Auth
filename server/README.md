# Advanced Authentication Backend

A secure, modular Node.js authentication server with advanced security features, JWT-based authentication, and comprehensive API endpoints.

## 🚀 Features

🔐 **Security First**

- JWT-based authentication with automatic refresh tokens
- HttpOnly cookie-based sessions (XSS protection)
- Password hashing with bcrypt (12 salt rounds)
- Email verification via OTP
- Rate limiting with Redis
- Input sanitization & validation
- XSS prevention
- Security headers with Helmet
- CORS protection

🏗️ **Modern Architecture**

- Modular MVC structure
- ES6 modules
- Redis for session management
- MongoDB with Mongoose
- Comprehensive logging
- Graceful error handling

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js     # Authentication logic
│   ├── services/
│   │   ├── auth.service.js        # Business logic
│   │   ├── email.service.js       # Email handling
│   │   └── token.service.js       # Token management
│   ├── models/
│   │   ├── User.model.js          # User schema
│   │   └── Token.model.js         # Token schema
│   ├── routes/
│   │   └── auth.routes.js         # API routes
│   ├── utils/
│   │   ├── logger.utils.js        # Logging configuration
│   │   └── validation.utils.js    # Input validation
│   ├── lib/
│   │   └── database.js            # Database connections
│   └── server.js                  # Express server setup
├── .env.example                   # Environment template
└── package.json
```

## 🛠 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "data": {
    "userId": "64f8a9b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "otpExpiresIn": 900
  }
}
```

#### POST `/api/auth/verify-registration`

Verify email using OTP sent during registration.

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully. Account is now active.",
  "data": {
    "userId": "64f8a9b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

#### POST `/api/auth/login`

Authenticate user and set secure HttpOnly cookies.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a9b2c3d4e5f6a7b8c9d0",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true
    }
  }
}
```

**Cookies Set:**

- `accessToken`: HttpOnly, Secure, SameSite=Strict
- `refreshToken`: HttpOnly, Secure, SameSite=Strict

#### POST `/api/auth/logout`

Clear authentication cookies and logout user.

**Request Body:** (empty)

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**

- `accessToken`: Set to expire
- `refreshToken`: Set to expire

#### POST `/api/auth/refresh-token`

Automatically refresh access tokens using refresh token cookie.

**Request Body:** (empty - uses refresh token from cookies)

**Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token"
  }
}
```

## 🔒 Security Features

### Rate Limiting

- **Registration**: 5 attempts per 15 minutes per IP
- **Login**: 10 attempts per 15 minutes per IP
- **OTP Verification**: 10 attempts per 15 minutes per IP
- **Token Refresh**: 20 attempts per 15 minutes per IP

### Password Security

- **Minimum Length**: 8 characters (configurable)
- **Maximum Length**: 128 characters (configurable)
- **Complexity Requirements**:
  - Minimum 1 uppercase letter (configurable)
  - Minimum 1 number (configurable)
  - Minimum 1 symbol (configurable)
- **Hashing**: bcrypt with 12 salt rounds

### Token Security

- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **HttpOnly Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS only in production
- **SameSite Protection**: Prevents CSRF attacks

### Input Validation

- Email format validation
- Password strength validation
- OTP format validation (6 digits)
- SQL injection prevention
- XSS protection

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/advanced-auth
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Email Configuration (choose one)
MAILTRAP_API_KEY=your-mailtrap-api-key     # Development
RESEND_API_KEY=your-resend-api-key         # Production
FROM_EMAIL=noreply@yourdomain.com

# Security Configuration
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_MIN_UPPERCASE=1
PASSWORD_MIN_NUMBERS=1
PASSWORD_MIN_SYMBOLS=1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # General limit
```

## 🔄 Token Management

### Access Token

- **Purpose**: API authentication
- **Expiration**: 15 minutes
- **Storage**: HttpOnly cookie
- **Auto Refresh**: Yes (via refresh token)

### Refresh Token

- **Purpose**: Token rotation
- **Expiration**: 7 days
- **Storage**: HttpOnly cookie
- **Rotation**: Yes (new token on each refresh)

### Token Flow

1. User logs in → Server sets both cookies
2. API calls use access token automatically
3. When access token expires → Backend auto-uses refresh token
4. New access token generated → Refresh token rotated
5. User logout → Both cookies cleared

## 📧 Email Services

### Development (Mailtrap)

```bash
MAILTRAP_API_KEY=your-mailtrap-key
```

### Production (Resend)

```bash
RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@yourdomain.com
```

### Email Templates

- **Registration OTP**: 6-digit code, 15-minute expiry
- **Welcome Email**: Sent after successful verification
- **Password Reset**: (Future feature)

## 🛠 Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Setup Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Verify Setup**
   - Server runs on `http://localhost:3000`
   - Health check: `GET /health`
   - API docs: `GET /api-docs` (if implemented)

## 🚀 Production Deployment

### Environment Setup

- Set `NODE_ENV=production`
- Use HTTPS URLs
- Configure production database URLs
- Set strong JWT secrets
- Configure proper email service

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### API Testing Examples

**Register User:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

**Login User:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt
```

**Access Protected Route:**

```bash
curl -X GET http://localhost:3000/api/protected \
  -b cookies.txt
```

## 📝 Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### Actual Error Messages

**Validation Errors:**
- "First name is required."
- "Last name is required."
- "Email is required."
- "Please enter a valid email address."
- "Email address already in use, Please choose another."
- "Password is required."
- "Password must be 8-128 characters and include at least 1 uppercase, 1 numbers, and 1 symbol."
- "Registration token is required."
- "Invalid registration token format."
- "OTP is required."
- "OTP must be a 4-digit number."

**Authentication Errors:**
- "User Already Exists"
- "User Not Found"
- "Invalid Password"
- "Refresh token required"
- "Invalid refresh token"
- "Refresh token expired"
- "Refresh Token Not Found"
- "Refresh Token Failed To Delete"

**OTP & Rate Limiting Errors:**
- "Account is locked due to multiple failed attempts. Please Try Again After 30 Minutes."
- "Too many failed attempts. Please try again after 30 minutes."
- "Too many failed attempts. Please try again after 1 hour."
- "Please wait 1 minute before requesting a new OTP code."
- "Invalid or expired OTP"
- "Incorrect OTP - X attempt(s) left"
- "Too many failed attempts, Your account has been locked for 30 minutes."

## 📊 Monitoring & Logging

### Log Levels

- `error`: Critical errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Monitoring Metrics

- Request count and response times
- Authentication success/failure rates
- Rate limiting triggers
- Database connection status
- Redis connection status

Perfect foundation for building secure, scalable applications! 🚀

