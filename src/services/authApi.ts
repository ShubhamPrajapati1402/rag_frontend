import { UserProfile } from '../types';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface AuthResponse {
  message?: string;
  access_token?: string;
  token_type?: string;
  user?: UserProfile;
}

export const authApi = {
  // 1. Sign Up - Triggers 6-digit OTP to user email
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Ensures HttpOnly cookies are handled
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Signup failed. Please try again.');
    }
    return data;
  },

  // 2. Verify OTP - Verifies 6-digit code and starts authenticated cookie session
  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Invalid or expired OTP code.');
    }
    return data;
  },

  // 3. Resend OTP - Resends verification code to email
  resendOtp: async (email: string): Promise<AuthResponse> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Failed to resend OTP.');
    }
    return data;
  },

  // 4. Login - Authenticate with email & password
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Invalid email or password.');
    }
    return data;
  },

  // 5. Google Sign In / Sign Up using ID Token
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Google authentication failed.');
    }
    return data;
  },

  // 6. Get Current User Profile (Session check)
  getMe: async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) return null;
      const data = await res.json();
      return {
        name: data.name || data.full_name || 'User',
        email: data.email,
        role: data.role || 'Pro Workspace'
      };
    } catch {
      return null;
    }
  },

  // 7. Logout - Clear HttpOnly session cookies
  logout: async (): Promise<void> => {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout failed:', e);
    }
  }
};
