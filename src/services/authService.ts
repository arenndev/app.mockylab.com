import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:5002/api';

// Add default headers
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.post['Accept'] = 'application/json';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

export const authService = {
  async login(username: string, password: string) {
    try {
      console.log('Sending login request:', { username, password });
      
      const response = await axios.post(`${API_URL}/Auth/login`, {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        // Store in both localStorage and cookies
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        
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