import { apiClient, endpoints } from '@/utils/apiConfig';
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';

interface LoginResponse {
  token: string;
  refreshToken?: string;
}

interface DecodedToken {
  sub: string;
  jti: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
  exp: number;
  iss: string;
  aud: string;
  userId?: string;
  [key: string]: any;
}

class AuthService {
  private tokenKey = 'token';
  private refreshTokenKey = 'refreshToken';
  private userKey = 'user';

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await apiClient.post<LoginResponse>(endpoints.auth.login, {
        username,
        password
      });

      if (response.data.token) {
        const decodedToken = jwtDecode<DecodedToken>(response.data.token);
        
        // Add userId from nameidentifier claim
        decodedToken.userId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        
        // Store in both localStorage and cookies
        localStorage.setItem(this.tokenKey, response.data.token);
        Cookies.set(this.tokenKey, response.data.token, {
          expires: 1, // 1 day
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        if (response.data.refreshToken) {
          localStorage.setItem(this.refreshTokenKey, response.data.refreshToken);
          Cookies.set(this.refreshTokenKey, response.data.refreshToken, {
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }

        localStorage.setItem(this.userKey, JSON.stringify(decodedToken));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);

    // Clear cookies
    Cookies.remove(this.tokenKey);
    Cookies.remove(this.refreshTokenKey);

    // Clear axios default header
    delete apiClient.defaults.headers.common['Authorization'];
  }

  getToken(): string | null {
    // Try cookie first, then localStorage
    const token = Cookies.get(this.tokenKey) || localStorage.getItem(this.tokenKey);
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired, try to refresh
          this.refreshToken().catch(() => {
            this.logout();
          });
          return null;
        }
        return token;
      } catch {
        // Invalid token
        this.logout();
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getCurrentUser(): DecodedToken | null {
    try {
      const token = this.getToken();
      if (!token) return null;
      
      const decodedToken = jwtDecode<DecodedToken>(token);
      // Add userId from nameidentifier claim
      decodedToken.userId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      
      return decodedToken;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = Cookies.get(this.refreshTokenKey) || localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) return false;

    try {
      const response = await apiClient.post<LoginResponse>(endpoints.auth.refreshToken, {
        refreshToken
      });

      if (response.data.token) {
        const decodedToken = jwtDecode<DecodedToken>(response.data.token);
        // Add userId from nameidentifier claim
        decodedToken.userId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        
        // Update both localStorage and cookies
        localStorage.setItem(this.tokenKey, response.data.token);
        Cookies.set(this.tokenKey, response.data.token, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        if (response.data.refreshToken) {
          localStorage.setItem(this.refreshTokenKey, response.data.refreshToken);
          Cookies.set(this.refreshTokenKey, response.data.refreshToken, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }

        localStorage.setItem(this.userKey, JSON.stringify(decodedToken));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return false;
    }
  }
}

export const authService = new AuthService(); 