# Cursor Rules for MockyLab Project

## Project Structure
- Frontend: Next.js project (MockyLab.FrontNextJs)
- Backend: .NET project (managed in Rider)

## Development Rules

### 1. Code Organization
- Backend changes are made in Rider
- Frontend changes are made in Cursor
- Keep separation of concerns in mind

### 2. API Integration
- Base API URL: http://localhost:5002/api
- All API endpoints should be properly authenticated
- Store sensitive data securely in the database

### 3. Authentication
- JWT-based authentication
- Token stored in both localStorage and cookies
- Automatic redirect to login page when unauthorized

### 4. Frontend Structure
- Pages organized by feature (e.g., /mockup, /printify)
- Shared components in /components directory
- Services in /services directory

### 5. Database Access Pattern

The project uses Unit of Work and Generic Repository patterns:

```csharp
public interface IUnitOfWork : IDisposable
{
    IGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync();
    void BeginTransaction();
    void CommitTransaction();
    void RollbackTransaction();
}

public interface IGenericRepository<T> where T : class
{
    IQueryable<T> Get(Expression<Func<T, bool>> filter = null);
    Task<T> GetByIdAsync(object id);
    Task InsertAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
}
```

### 6. Authentication Service

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
  },

  getToken() {
    return localStorage.getItem('token') || Cookies.get('token');
  }
};
```

### 7. Printify Integration

#### Blueprint Management

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

interface UserBlueprint {
  id: number;
  userId: number;
  blueprintId: number;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  blueprint?: Blueprint;
}
```

#### User Blueprint Management

1. **API Endpoints**:
   - POST `/api/UserOfBlueprint` - Blueprint ekleme
   - GET `/api/UserOfBlueprint/user/{userId}` - Kullanıcının blueprint'lerini listeleme
   - DELETE `/api/UserOfBlueprint/{id}` - Blueprint silme
   - GET `/api/Printify/blueprints/{id}` - Blueprint detaylarını getirme

2. **Frontend Pages**:
   - `/printify/blueprints` - Blueprint listeleme ve seçme
   - `/printify/my-blueprints` - Seçilen blueprint'leri görüntüleme

3. **Features**:
   - Blueprint arama ve filtreleme
   - Sayfalama (12 blueprint per page)
   - Lazy image loading
   - Auth token ile güvenli erişim
   - Hata yönetimi ve retry mekanizması

#### Variant Management

1. **Entities**:
```typescript
interface BlueprintVariant {
    id: number;
    blueprintId: number;
    printProviderId: number;
    variantId: number;
    title: string;
    options: string; // JSON formatted options
    isActive: boolean;
    placeholders: VariantPlaceholder[];
}

interface VariantPlaceholder {
    id: number;
    variantId: number;
    position: string;
    width: number;
    height: number;
    isActive: boolean;
}
```

2. **API Endpoints**:
   - GET `/api/Printify/blueprints/{blueprintId}/variants` - Variant listesi (sayfalı)
   - GET `/api/Printify/variants/{variantId}` - Variant detayı
   - POST `/api/Printify/blueprints/{blueprintId}/variants/sync` - Variant senkronizasyonu

3. **Features**:
   - JSONB veri depolama
   - Otomatik API senkronizasyonu
   - Sayfalı veri çekme
   - Placeholder yönetimi
   - Variant önizleme

4. **Frontend Pages**:
   - `/printify/blueprints/[id]` - Blueprint detay sayfası ve variant listesi
   - Variant kartları ve placeholder bilgileri
   - Görsel önizleme ve seçim

### 8. Error Handling
- Proper error messages for API failures
- User-friendly error displays
- Retry mechanism for failed requests
- Redirect to login when authentication fails

### 9. Security
- Never expose sensitive data in frontend code
- Always validate user authentication
- Secure API endpoints with proper authorization
- Use proper token management

### 10. Testing
- Test API integrations thoroughly
- Verify authentication flows
- Test user flows and navigation
- Check error handling scenarios 