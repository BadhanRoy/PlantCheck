import { create } from 'zustand';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  isLoading: false,

  // ===== CHECK AUTH =====
  checkAuth: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check-auth`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({
          user: data.user,
          isAuthenticated: true,
          isCheckingAuth: false
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isCheckingAuth: false
        });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false
      });
    }
  },

  // ===== EMAIL SIGNUP =====
  signup: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
        toast.success('Account created! Check your email for verification code.');
        return { success: true, data, needsVerification: true };
      } else {
        toast.error(data.message || 'Signup failed');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ===== VERIFY EMAIL =====
  verifyEmail: async (code) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({ 
          user: data.user, 
          isAuthenticated: true,
          isLoading: false 
        });
        toast.success('Email verified successfully! 🎉');
        return { success: true, data };
      } else {
        toast.error(data.message || 'Verification failed');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ===== RESEND VERIFICATION CODE =====
  resendVerificationCode: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification code resent! 📧');
        set({ isLoading: false });
        return { success: true };
      } else {
        toast.error(data.message || 'Failed to resend code');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ===== EMAIL LOGIN =====
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });

        if (!data.user.isVerified) {
          toast.success('Please verify your email first! 📧');
          return { success: true, data, needsVerification: true };
        }
        
        toast.success('Login successful! 🌱');
        return { success: true, data };
      } else {
        toast.error(data.message || 'Login failed');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ===== LOGOUT =====
  logout: async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    }
  },

  // ===== GOOGLE LOGIN =====
  googleLogin: async (credential) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true, data };
      } else {
        toast.error(data.message || 'Google login failed');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ===== GOOGLE SIGNUP =====
  googleSignup: async (credential) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/auth/google-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true, data };
      } else {
        toast.error(data.message || 'Google signup failed');
        set({ isLoading: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));