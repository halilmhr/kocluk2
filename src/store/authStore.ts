import { create } from 'zustand';
import { User } from '../types';
import { supabase, signIn, signOut, signUp } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set(state => {
        const userObject = user ? { id: user.id, email: user.email || '', name: user.user_metadata?.name } : null;
        // Only update initialized and loading on the first call
        if (!state.initialized) {
          return {
            user: userObject,
            initialized: true,
            loading: false
          };
        }
        // For subsequent calls, just update the user
        return { user: userObject };
      });
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

    login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      if (data?.user) {
        set({ 
          user: { 
            id: data.user.id, 
            email: data.user.email || '',
            name: data.user.user_metadata?.name
          }, 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      if (data?.user) {
        set({ 
          user: { 
            id: data.user.id, 
            email: data.user.email || '',
            name: data.user.user_metadata?.name
          }, 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  logout: async () => {
    set({ loading: true });
    try {
      await signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },

  setUser: (user) => {
    set({ user });
    }
}));