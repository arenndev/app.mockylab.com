import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL, AUTH_ENDPOINTS, getFullUrl } from '../utils/apiConfig';

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', API_URL);

// Add default headers and axios configuration
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.post['Accept'] = 'application/json';

// Ignore HTTPS certificate errors in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const authService = {
  async login(username: string, password: string) {
    try {
      const loginUrl = getFullUrl(AUTH_ENDPOINTS.login);
      console.log('Sending login request:', { username, password });
      console.log('Using API URL:', loginUrl);
      
      const response = await axios.post(loginUrl, {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        // Create user object with necessary information
        const user = {
          userId: response.data.userId,
          username: response.data.username,
          roles: response.data.roles || [],
          token: response.data.token
        };

        // Store in both localStorage and cookies
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set cookie with options
        Cookies.set('token', response.data.token, {
          expires: 1, // 1 day
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Redirect to mockup list
        window.location.href = '/mockup/list';
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Invalid credentials');
      }
      throw new Error('Network error occurred');
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token', { path: '/' });
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token') || Cookies.get('token');
  }
}; 