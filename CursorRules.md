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
- Printify-related operations handled through UserController

### 6. Navigation
- Sidebar contains only relevant menu items:
  - Mockups (with submenu)
  - Design Create
  - Printify Settings

### 7. Error Handling
- Proper error messages for API failures
- User-friendly error displays
- Redirect to login when authentication fails

### 8. Code Style
- Use TypeScript for frontend
- C# for backend
- Maintain consistent naming conventions
- Keep code modular and reusable

### 9. Security
- Never expose sensitive data in frontend code
- Always validate user authentication
- Secure API endpoints with proper authorization

### 10. Testing
- Test API integrations thoroughly
- Verify authentication flows
- Test user flows and navigation 

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