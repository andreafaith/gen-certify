import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user) {
        console.log('No user session found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Log session data
        console.log('Current Session:', {
          user: session.user,
          metadata: session.user.user_metadata,
          appMetadata: session.user.app_metadata,
        });

        // Check user metadata
        const metadataRole = session.user.user_metadata?.role;
        const appMetadataRole = session.user.app_metadata?.role;
        
        // Check database role using profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error checking profile role:', profileError);
        }

        // Log all role data
        console.log('Role Check:', {
          userId: session.user.id,
          metadataRole,
          appMetadataRole,
          profileRole: profileData?.user_role,
        });

        // User is admin if any role source indicates admin
        const isAdminUser = 
          metadataRole === 'admin' || 
          appMetadataRole === 'admin' ||
          profileData?.user_role === 'admin' ||
          metadataRole === 'super_admin' ||
          appMetadataRole === 'super_admin' ||
          profileData?.user_role === 'super_admin';

        console.log('Admin Status:', isAdminUser);
        
        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
    </div>;
  }

  if (!session) {
    console.log('Redirecting to login - No session');
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    console.log('Access denied: User is not an admin');
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
