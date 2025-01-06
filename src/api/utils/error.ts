import { NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { ApiResponse } from '../types';

export async function handleError(error: any, res: NextApiResponse<ApiResponse>) {
  console.error('API Error:', error);

  // Log error
  try {
    const session = await supabase.auth.getSession();
    if (session.data.session) {
      await supabase.rpc('log_error', {
        p_user_id: session.data.session.user.id,
        p_error_type: error.name || 'API Error',
        p_error_message: error.message || 'Unknown error occurred',
        p_stack_trace: error.stack,
      });
    }
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }

  // Determine status code
  let statusCode = 500;
  if (error.message === 'Unauthorized') statusCode = 401;
  if (error.message === 'Forbidden') statusCode = 403;
  if (error.message === 'Not found') statusCode = 404;
  if (error.message === 'Rate limit exceeded') statusCode = 429;
  if (error.message?.includes('Validation error')) statusCode = 400;

  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An unexpected error occurred',
    metadata: {
      timestamp: new Date().toISOString(),
      errorType: error.name || 'UnknownError',
    },
  });
}
