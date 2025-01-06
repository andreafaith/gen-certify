import { NextApiRequest } from 'next';
import { supabase } from '../../lib/supabase';

declare module 'next' {
  interface NextApiRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function validateAuth(req: NextApiRequest): Promise<void> {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Get user metadata including role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    if (userData?.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: userData?.role || 'user',
    };

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action: 'api_access',
      p_details: {
        method: req.method,
        path: req.url,
      },
    });
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
