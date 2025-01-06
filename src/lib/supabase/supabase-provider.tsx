import { createContext, useContext, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { getSupabaseClient } from './supabase-client';

interface SupabaseContext {
  supabase: SupabaseClient<Database>;
}

const supabase = getSupabaseClient();
const Context = createContext<SupabaseContext>({ supabase });

// Export the provider component
export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Delete cached data and session
        localStorage.removeItem('certificate-generator-auth');
        sessionStorage.removeItem('certificate-generator-auth');
        const expires = new Date(0).toUTCString();
        document.cookie = `my-access-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
        document.cookie = `my-refresh-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Store session data
        if (session) {
          const sessionData = JSON.stringify(session);
          localStorage.setItem('certificate-generator-auth', sessionData);
          sessionStorage.setItem('certificate-generator-auth', sessionData);
        }
        const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years
        document.cookie = `my-access-token=${session?.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        document.cookie = `my-refresh-token=${session?.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
};

// Export the hook as a named export
export const useSupabase = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
