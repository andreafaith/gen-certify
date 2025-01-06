import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

export function AdminRoute() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      try {
        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // First try to get the role from user metadata
        const role = session.user.user_metadata?.role;
        if (role === 'admin' || role === 'super_admin') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // If not in metadata, check the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking profile role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
