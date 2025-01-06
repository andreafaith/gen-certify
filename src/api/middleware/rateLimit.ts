import { NextApiRequest } from 'next';
import { supabase } from '../../lib/supabase';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const WINDOW_SIZE = 60; // 1 minute
const MAX_REQUESTS = 100; // requests per minute

export async function rateLimit(req: NextApiRequest): Promise<void> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Unauthorized');
  }

  const userId = session.data.session.user.id;
  const now = Date.now();
  const key = `rate_limit:${userId}`;

  // Get current settings
  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'rate_limit')
    .single();

  const limit = settings?.value || MAX_REQUESTS;

  // Get the current window
  const current = await redis.get<number[]>(key);
  const currentWindow = current || [];

  // Filter requests within the window
  const windowStart = now - WINDOW_SIZE * 1000;
  const windowRequests = currentWindow.filter(timestamp => timestamp > windowStart);

  if (windowRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }

  // Add current request and update window
  windowRequests.push(now);
  await redis.set(key, windowRequests, {
    ex: WINDOW_SIZE,
  });
}
