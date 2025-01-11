# Database Access Pattern

## Unit of Work Pattern
The application uses the Unit of Work pattern for database operations:

```csharp
public interface IUnitOfWork : IDisposable
{
    IGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync();
    void BeginTransaction();
    void CommitTransaction();
    void RollbackTransaction();
}
```

## Generic Repository Pattern
```csharp
public interface IGenericRepository<T> where T : class
{
    IQueryable<T> Get(Expression<Func<T, bool>> filter = null);
    Task<T> GetByIdAsync(object id);
    Task InsertAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
}
```

## Usage Example
```csharp
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
```

# Authentication and Login Implementation

## Authentication Service
```typescript
const API_URL = 'http://localhost:5002/api';

export const authService = {
  async login(username: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/Auth/login`, {
        username,
        password
      });
      
      if (response.data.token) {
        const user = {
          userId: response.data.userId,
          username: response.data.username,
          roles: response.data.roles || [],
          token: response.data.token
        };

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        Cookies.set('token', response.data.token, {
          expires: 1,
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      throw new Error('Invalid credentials or network error');
    }
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token', { path: '/' });
    delete axios.defaults.headers.common['Authorization'];
  }
};
```

# Printify Integration

## Blueprint Management

### Blueprint Entity
```typescript
interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
  isActive: boolean;
}

interface BlueprintListResponse {
  items: Blueprint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Backend Implementation
```csharp
public async Task<(List<PrintifyBlueprint> Items, int TotalCount)> GetBlueprintsFromDbAsync(
    string? search = null,
    string? brand = null,
    int page = 1,
    int pageSize = 12)
{
    var query = _unitOfWork.GetRepository<PrintifyBlueprint>()
        .Get(b => b.IsActive);

    // Case-insensitive search
    if (!string.IsNullOrEmpty(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(b => 
            EF.Functions.Like(b.Title.ToLower(), $"%{searchLower}%") || 
            EF.Functions.Like(b.Description.ToLower(), $"%{searchLower}%") || 
            EF.Functions.Like(b.Model.ToLower(), $"%{searchLower}%"));
    }

    if (!string.IsNullOrEmpty(brand))
    {
        var brandLower = brand.ToLower();
        query = query.Where(b => b.Brand.ToLower() == brandLower);
    }

    var totalCount = await query.CountAsync();
    var items = await query
        .OrderBy(b => b.Brand)
        .ThenBy(b => b.Title)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return (items, totalCount);
}
```

### Frontend Implementation
Blueprint listing page features:
- Grid layout (4x3)
- 12 blueprints per page
- Search in title, description, and model
- Filter by brand
- Pagination
- Lazy image loading

## Next Steps: Variant Management

### Variant Entity Structure
```typescript
interface Variant {
  id: number;
  title: string;
  options: {
    color: string;
    size: string;
  };
  placeholders: {
    position: string;
    width: number;
    height: number;
  }[];
}
```

### Planned Features
1. User-specific blueprint selection
   - Allow users to select products they want to sell
   - Save selected blueprints

2. Variant management
   - Endpoint: `/v1/catalog/blueprints/{blueprintId}/print_providers/99/variants.json`
   - Fetch variant data for selected blueprints
   - Store variant data in database

3. Blueprint detail page
   - Detailed blueprint information
   - Variant list and management
   - Placeholder preview

### Important Notes
- Fetch variant data only for selected blueprints
- Optimize data management with user-based blueprint selection
- Implement regular variant data updates 