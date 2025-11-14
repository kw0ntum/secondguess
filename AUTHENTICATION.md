# Authentication System

## Overview

The AI Voice SOP Agent now implements a secure JWT-based authentication system, replacing the previous hardcoded mock token approach.

## Security Improvements

### Previous Implementation (Insecure)
- ❌ Hardcoded `'mock-valid-token'` exposed in client-side JavaScript
- ❌ Token visible in page source to anyone
- ❌ No token expiration
- ❌ No token refresh mechanism
- ❌ Anyone could extract and reuse the token

### Current Implementation (Secure)
- ✅ Dynamic JWT token generation
- ✅ Tokens expire after 24 hours
- ✅ Tokens stored in sessionStorage (cleared when browser closes)
- ✅ Token refresh capability
- ✅ Guest/anonymous user support for demos
- ✅ Proper JWT validation with signature verification
- ✅ Environment-based secret key configuration

## Architecture

### Backend Components

#### 1. AuthService (`src/api/services/auth.service.ts`)
Handles all authentication operations:
- JWT token generation and validation
- Password hashing and comparison (for future user registration)
- Guest token generation
- Password strength validation
- Email format validation

#### 2. Auth Middleware (`src/api/middleware/auth.ts`)
- `authenticateUser`: Validates JWT tokens on protected routes
- `requireRoles`: Checks user permissions
- `optionalAuth`: Optional authentication for public routes

#### 3. Auth Routes (`src/api/routes/auth.routes.ts`)
- `POST /api/auth/guest`: Generate guest token for anonymous users
- `POST /api/auth/refresh`: Refresh an existing token

### Frontend Implementation

#### Token Acquisition
On page load, the frontend:
1. Checks sessionStorage for existing valid token
2. If no valid token exists, requests a guest token from `/api/auth/guest`
3. Stores token in sessionStorage with expiry time
4. Uses token for all subsequent API calls

#### Token Storage
- Tokens are stored in `sessionStorage` (not `localStorage`)
- sessionStorage is cleared when the browser tab/window closes
- More secure than localStorage for sensitive data
- Includes expiry timestamp for validation

#### Token Usage
All API calls include the token in the Authorization header:
```javascript
headers: {
    'Authorization': `Bearer ${authToken}`
}
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```bash
# JWT Secret Key (REQUIRED in production)
JWT_SECRET=your-super-secret-key-change-this-in-production

# JWT Token Expiry (optional, defaults to 24h)
JWT_EXPIRY=24h
```

**⚠️ IMPORTANT**: Never commit your production `JWT_SECRET` to version control!

### Generating a Secure Secret

```bash
# Generate a random 256-bit secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### Generate Guest Token
```bash
POST /api/auth/guest
Content-Type: application/json

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "24h",
  "userType": "guest"
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Authorization: Bearer <current-token>

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "24h"
}
```

### Using Protected Endpoints
```bash
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123"
}
```

## Testing

### Manual Testing

1. **Test guest token generation:**
```bash
curl -X POST http://localhost:3000/api/auth/guest \
  -H "Content-Type: application/json"
```

2. **Test protected endpoint with token:**
```bash
# First, get a token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/guest | jq -r '.token')

# Then use it
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"test-user"}'
```

3. **Test token refresh:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Tests

Update test files to use dynamic tokens:

```javascript
// Before each test suite
let authToken;

beforeAll(async () => {
  const response = await fetch('http://localhost:3000/api/auth/guest', {
    method: 'POST'
  });
  const data = await response.json();
  authToken = data.token;
});

// In tests
const response = await fetch('http://localhost:3000/api/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({ userId: 'test' })
});
```

## Migration Guide

### For Developers

If you have existing code using the old `mock-valid-token`:

1. **Remove hardcoded tokens:**
```javascript
// ❌ Old way
const AUTH_TOKEN = 'mock-valid-token';

// ✅ New way
let authToken = null;
```

2. **Obtain token dynamically:**
```javascript
async function obtainAuthToken() {
  const response = await fetch('/api/auth/guest', {
    method: 'POST'
  });
  const data = await response.json();
  authToken = data.token;
  sessionStorage.setItem('authToken', authToken);
}
```

3. **Use dynamic token in requests:**
```javascript
// ❌ Old way
headers: {
  'Authorization': `Bearer ${AUTH_TOKEN}`
}

// ✅ New way
headers: {
  'Authorization': `Bearer ${authToken}`
}
```

### For Test Scripts

Update curl commands and test scripts:

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/guest | jq -r '.token')

# Use in subsequent requests
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"test"}'
```

## Future Enhancements

### Planned Features

1. **User Registration & Login**
   - Email/password authentication
   - Password reset functionality
   - Email verification

2. **OAuth2 Integration**
   - Google Sign-In
   - GitHub OAuth
   - Microsoft Azure AD

3. **Role-Based Access Control (RBAC)**
   - Admin, User, Guest roles
   - Permission-based feature access
   - Organization/team management

4. **Token Management**
   - Refresh token rotation
   - Token revocation
   - Session management dashboard

5. **Security Enhancements**
   - Rate limiting per user
   - Suspicious activity detection
   - Two-factor authentication (2FA)

## Security Best Practices

### For Production Deployment

1. **Use Strong Secrets**
   - Generate cryptographically secure random secrets
   - Minimum 256 bits (32 bytes)
   - Never reuse secrets across environments

2. **Environment Configuration**
   - Store secrets in environment variables
   - Use secret management services (AWS Secrets Manager, Azure Key Vault)
   - Never commit secrets to version control

3. **HTTPS Only**
   - Always use HTTPS in production
   - Enable HSTS headers
   - Use secure cookies for token storage (when implementing cookie-based auth)

4. **Token Expiry**
   - Keep token expiry short (1-24 hours)
   - Implement refresh tokens for longer sessions
   - Invalidate tokens on logout

5. **Monitoring**
   - Log authentication failures
   - Monitor for suspicious patterns
   - Set up alerts for unusual activity

## Troubleshooting

### Common Issues

**Issue: "Invalid or expired authorization token"**
- Token may have expired (24h default)
- Request a new token from `/api/auth/guest`
- Check that token is being sent in Authorization header

**Issue: "Authorization token is required"**
- Ensure Authorization header is present
- Check header format: `Bearer <token>`
- Verify token is not null or undefined

**Issue: "Failed to obtain auth token"**
- Check that server is running
- Verify `/api/auth/guest` endpoint is accessible
- Check browser console for network errors

## Support

For questions or issues related to authentication:
1. Check this documentation
2. Review the code in `src/api/services/auth.service.ts`
3. Check server logs for authentication errors
4. Open an issue on GitHub with details

## References

- [JWT.io](https://jwt.io/) - JWT token debugger and documentation
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
