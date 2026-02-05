# Advanced Auth Frontend

A clean, modern React frontend for the Advanced Authentication backend. Built with Vite, React Router, and Tailwind CSS.

## Features

🔐 **Authentication Flow**
- User registration with email verification
- Secure cookie-based authentication
- OTP-based email verification
- Automatic token refresh via cookies

🎨 **Modern UI**
- Responsive design with Tailwind CSS
- Beautiful icons with Lucide React
- Toast notifications with react-hot-toast
- Smooth animations and transitions

🚀 **Developer Experience**
- Component-based architecture
- Clean, reusable code
- Easy customization
- Environment-based configuration

🍪 **Security Benefits**
- HttpOnly cookies prevent XSS attacks
- Secure flag for HTTPS only
- SameSite protection against CSRF
- Automatic token rotation

## Quick Start

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Configure API URL**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Visit `http://localhost:5173` (or the port shown) to see your app.

## Environment Variables

```bash
VITE_API_URL=http://localhost:3000  # Your backend URL
```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Login page
│   │   ├── Register.jsx       # Registration page
│   │   ├── VerifyEmail.jsx    # OTP verification page
│   │   └── utils.js          # API utilities
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Router setup
│   └── index.css             # Global styles
├── .env.example              # Environment template
└── package.json
```

## Authentication Flow

1. **Registration** → User fills form → Receives OTP email
2. **Email Verification** → User enters OTP → Account created
3. **Login** → User credentials → Server sets secure HttpOnly cookies
4. **Auto Refresh** → Access token expires → Backend automatically refreshes cookies

## Cookie-based Security

✅ **HttpOnly Cookies** - Prevent JavaScript access, stops XSS attacks
✅ **Secure Flag** - Only sent over HTTPS
✅ **SameSite Protection** - Prevents CSRF attacks  
✅ **Automatic Refresh** - No manual token management needed
✅ **Server Control** - Backend can revoke tokens anytime

## API Integration

The frontend automatically handles:
- Cookie-based authentication (no localStorage needed)
- Automatic token refresh via server cookies
- Error handling and user feedback
- Session management
- Automatic logout on session expiry

## Customization

### Branding
- Update logos and colors in component files
- Modify Tailwind config for custom theme
- Add your own SVG icons

### Styling
- Edit `src/index.css` for global styles
- Component-specific styles in JSX
- Responsive breakpoints included

### API Endpoints
- All API calls use `utils.js`
- Easy to add new endpoints
- Built-in error handling

## Security Features

- HTTPS enforcement in production
- Token-based authentication
- Automatic token rotation
- XSS prevention
- Secure cookie handling

## Production Deployment

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy to static hosting**
   - Vercel, Netlify, or similar
   - Configure `VITE_API_URL` to production backend

3. **CORS Configuration**
   Ensure your backend allows your frontend domain in `ALLOWED_ORIGINS`

Perfect companion for the Advanced Auth backend! 🚀