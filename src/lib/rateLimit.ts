import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export interface RateLimitConfig {
  maxRequests: number;  // Maximum number of requests
  windowMs: number;     // Time window in milliseconds
  message?: string;     // Custom error message
}

export async function rateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig
): Promise<boolean> {
  const key = `rate_limit:${action}:${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get current request count from the api_logs table
    const { count } = await supabase
      .from('api_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', new Date(windowStart).toISOString())
      .single();

    if (count >= config.maxRequests) {
      // Log the rate limit violation
      await supabase.from('error_logs').insert({
        user_id: userId,
        error_type: 'RATE_LIMIT_EXCEEDED',
        error_message: `Rate limit exceeded for action: ${action}`,
        metadata: { config, count }
      });

      return false;
    }

    // Log the API call
    await supabase.from('api_logs').insert({
      user_id: userId,
      endpoint: action,
      method: 'POST',
      status_code: 200,
      response_time: 0
    });

    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // If rate limiting fails, we'll allow the request but log the error
    await supabase.from('error_logs').insert({
      user_id: userId,
      error_type: 'RATE_LIMIT_ERROR',
      error_message: 'Failed to check rate limit',
      metadata: { error }
    });
    return true;
  }
}
