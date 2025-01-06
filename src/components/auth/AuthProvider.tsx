import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const initialContext: AuthContextType = {
  session: null,
  user: null,
  loading: true,
};

const AuthContext = createContext<AuthContextType>(initialContext);
const supabase = getSupabaseClient();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to recover session from multiple storage locations
    const recoverSession = () => {
      try {
        // Try localStorage first
        const localSession = localStorage.getItem('certificate-generator-auth');
        if (localSession) {
          const parsed = JSON.parse(localSession);
          if (parsed?.access_token && parsed?.refresh_token) {
            return parsed;
          }
        }

        // Try sessionStorage next
        const sessionStorageData = sessionStorage.getItem('certificate-generator-auth');
        if (sessionStorageData) {
          const parsed = JSON.parse(sessionStorageData);
          if (parsed?.access_token && parsed?.refresh_token) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error recovering session:', error);
      }
      return null;
    };

    const recoveredSession = recoverSession();
    if (recoveredSession) {
      setSession(recoveredSession);
      setUser(recoveredSession.user);
    }

    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        // Store the fresh session
        const sessionData = JSON.stringify(session);
        localStorage.setItem('certificate-generator-auth', sessionData);
        sessionStorage.setItem('certificate-generator-auth', sessionData);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        const sessionData = JSON.stringify(session);
        localStorage.setItem('certificate-generator-auth', sessionData);
        sessionStorage.setItem('certificate-generator-auth', sessionData);
      } else {
        localStorage.removeItem('certificate-generator-auth');
        sessionStorage.removeItem('certificate-generator-auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};