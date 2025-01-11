# Cursor Rules for MockyLab Project

## Project Structure
- Frontend: Next.js project (MockyLab.FrontNextJs)
- Backend: .NET project (managed in Rider)

## Development Rules

### 1. Code Organization
- Backend changes are made in Rider
- Frontend changes are made in Cursor
- Keep separation of concerns in mind (e.g., using UserController for user-related operations)

### 2. API Integration
- Base API URL: http://localhost:5002/api
- All API endpoints should be properly authenticated
- Store sensitive data (like API keys) securely in the database

### 3. Authentication
- JWT-based authentication
- Token stored in both localStorage and cookies
- Automatic redirect to login page when unauthorized

### 4. Frontend Structure
- Pages organized by feature (e.g., /mockup, /printify)
- Shared components in /components directory
- Services in /services directory

### 5. Printify Integration
- API key stored in User entity
- Shop ID stored in User entity
- Settings managed through dedicated Printify Settings page
- Blueprint management through dedicated pages:
  - Blueprint listing page
  - Blueprint detail page with variant management
  - Automatic variant synchronization
  - Variant data stored in JSONB format
- Printify-related operations handled through PrintifyController

### 6. Navigation
- Sidebar contains only relevant menu items:
  - Mockups (with submenu)
  - Design Create
  - Printify Settings
  - My Blueprints

### 7. Error Handling
- Proper error messages for API failures
- User-friendly error displays
- Redirect to login when authentication fails
- Specific error handling for Printify API issues

### 8. Code Style
- Use TypeScript for frontend
- C# for backend
- Maintain consistent naming conventions
- Keep code modular and reusable

### 9. Security
- Never expose sensitive data in frontend code
- Always validate user authentication
- Secure API endpoints with proper authorization
- Store API keys securely

### 10. Testing
- Test API integrations thoroughly
- Verify authentication flows
- Test user flows and navigation
- Test Printify API integration scenarios

## Database Access Pattern

The project uses Unit of Work and Generic Repository patterns for database access:

### Unit of Work
- Manages database transactions
- Provides access to repositories
- Ensures data consistency
- Handles commit and rollback operations

```csharp
public interface IUnitOfWork
{
    IGenericRepository<T> GetRepository<T>() where T : class, IEntity;
    Task<int> SaveChangesAsync();
    void BeginTransaction();
    void CommitTransaction();
    void RollbackTransaction();
}
```

### Generic Repository
- Provides generic CRUD operations
- Works with any entity that implements IEntity
- Abstracts database operations

```csharp
public interface IGenericRepository<TEntity> where TEntity : class, IEntity
{
    void Add(TEntity entity);
    void Add(IEnumerable<TEntity> entities);
    bool Any(Expression<Func<TEntity, bool>> predicate);
    TEntity Get(int id);
    IQueryable<TEntity> Get();
    IQueryable<TEntity> Get(Expression<Func<TEntity, bool>> predicate);
    void Remove(TEntity entity);
    void Remove(IEnumerable<TEntity> entities);
}
```

### Usage Example
```csharp
public class SomeService
{
    private readonly IUnitOfWork _unitOfWork;

    public async Task DoSomething()
    {
        try
        {
            _unitOfWork.BeginTransaction();
            var repository = _unitOfWork.GetRepository<SomeEntity>();
            
            // Do operations
            
            await _unitOfWork.SaveChangesAsync();
            _unitOfWork.CommitTransaction();
        }
        catch
        {
            _unitOfWork.RollbackTransaction();
            throw;
        }
    }
} 

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
