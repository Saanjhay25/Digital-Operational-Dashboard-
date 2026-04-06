import { fetchApi } from '../utils/api';


/**
 * AuthService
 * Handles Authentication Business Logic with Role and Status validation.
 * Acts as the secure "Backend" API Route handler.
 */
export class AuthService {
  /**
   * Authenticates a user connecting to the backend API.
   */
  static async login(email: string, passwordPlain: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: passwordPlain })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from login:', text.substring(0, 200));
        return { success: false, error: 'Server returned an invalid response format. Please contact support.' };
      }

      if (!response.ok) {
        return { success: false, error: data.message || 'Invalid Username Or Password' };
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        success: true,
        user: {
          name: data.name,
          role: data.role,
          email: data.email,
          _id: data._id
        },
        token: data.token
      };
    } catch (e: any) {
      console.error('AuthService.login error:', e);
      return { success: false, error: 'Server unreachable. Please ensure the backend is running.' };
    }
  }

  /**
   * Registers a new user connecting to the backend API.
   */
  static async register(name: string, email: string, passwordPlain: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const response = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: passwordPlain })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from register:', text.substring(0, 200));
        return { success: false, error: 'Server returned an invalid response format. Please contact support.' };
      }

      if (!response.ok) {
        return { success: false, error: data.message || 'Registration failed.' };
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        success: true,
        user: {
          name: data.name,
          role: data.role,
          email: data.email,
          _id: data._id
        },
        token: data.token
      };
    } catch (e: any) {
      console.error('AuthService.register error:', e);
      return { success: false, error: 'Network error or server is down.' };
    }
  }

  /**
   * Secure Password Update (Self)
   */
  static async changePassword(currentPlain: string, newPlain: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchApi('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPlain, newPassword: newPlain })
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.message || 'Password update failed.' };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Critical connection failure.' };
    }
  }

  /**
   * Authenticates a user using Google Sign-In.
   */
  static async googleLogin(credential: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const response = await fetchApi('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from google login:', text.substring(0, 200));
        return { success: false, error: 'Server returned an invalid response format.' };
      }

      if (!response.ok) {
        return { success: false, error: data.message || 'Google Authentication Failed' };
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        success: true,
        user: {
          name: data.name,
          role: data.role,
          email: data.email,
          _id: data._id,
          mustChangePassword: data.mustChangePassword
        },
        token: data.token
      };
    } catch (e: any) {
      console.error('AuthService.googleLogin error:', e);
      return { success: false, error: 'Server unreachable. Please ensure the backend is running.' };
    }
  }
}
