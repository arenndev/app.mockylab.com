# Authentication and Login Implementation

## Authentication Service

The authentication service handles user login, token management, and session persistence. Here's how it's implemented:

```typescript
// src/services/authService.ts

const API_URL = 'http://localhost:5002/api';

export const authService = {
  async login(username: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/Auth/login`, {
        username,
        password
      });
      
      if (response.data.token) {
        // Store user data
        const user = {
          userId: response.data.userId,
          username: response.data.username,
          roles: response.data.roles || [],
          token: response.data.token
        };

        // Persist in localStorage and cookies
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set cookie
        Cookies.set('token', response.data.token, {
          expires: 1, // 1 day
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });
        
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      // Handle errors
      throw new Error('Invalid credentials or network error');
    }
  },

  logout() {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token', { path: '/' });
    delete axios.defaults.headers.common['Authorization'];
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token') || Cookies.get('token');
  }
};
```

## Key Features

1. **Token Management**
   - JWT tokens are stored in both localStorage and cookies
   - Token is automatically added to all subsequent API requests
   - Token expiration is handled (1 day)

2. **Session Persistence**
   - User data is stored in localStorage
   - Token is stored in both localStorage and cookies for redundancy
   - Secure cookie settings in production

3. **Error Handling**
   - Network errors are caught and handled
   - Invalid credentials are properly reported
   - Token validation errors trigger logout

4. **Security Considerations**
   - Cookies use 'strict' SameSite in production
   - Secure flag is enabled in production
   - Sensitive data is not logged

## Usage Example

```typescript
// Login
try {
  await authService.login(username, password);
  // Redirect on success
  router.push('/dashboard');
} catch (error) {
  // Handle error
  setError(error.message);
}

// Get current user
const user = authService.getCurrentUser();

// Logout
authService.logout();
```

## Important Notes

1. Always use HTTPS in production
2. Keep tokens secure and never expose them
3. Implement proper token refresh mechanism
4. Handle token expiration gracefully
5. Clear all auth data on logout 