import { supabase } from '../lib/supabase';
import { rateLimit } from './middleware/rateLimit';
import { validateAuth } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { handleError } from './utils/error';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from './types';

// Template handlers
export async function handleGetTemplates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);

    const { page = 1, limit = 10, orderBy = 'created_at', orderDir = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data, error, count } = await supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .order(orderBy as string, { ascending: orderDir === 'asc' })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: {
        items: data,
        total: count,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// Certificate handlers
export async function handleGenerateCertificate(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);
    await validateRequest(req.body, 'certificateGenerate');

    const { templateId, data, outputFormat, settings } = req.body;

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;
    if (!template) throw new Error('Template not found');

    // Generate certificate logic here
    // This would integrate with a PDF/image generation service

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: req.user.id,
      p_action: 'generate_certificate',
      p_details: { templateId, outputFormat },
    });

    return res.status(200).json({
      success: true,
      data: {
        // Certificate data
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// User management handlers
export async function handleGetUsers(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);

    // Check admin permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new Error('Unauthorized');
    }

    const { page = 1, limit = 10, orderBy = 'created_at', orderDir = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order(orderBy as string, { ascending: orderDir === 'asc' })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: {
        items: data,
        total: count,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// Email template handlers
export async function handleGetEmailTemplates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);

    // Check admin permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// System settings handlers
export async function handleGetSystemSettings(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);

    // Check admin permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// Analytics handlers
export async function handleGetUsageStatistics(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    await validateAuth(req);
    await rateLimit(req);

    // Check admin permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new Error('Unauthorized');
    }

    const { timeRange = 'week' } = req.query;
    let startDate = new Date();

    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        throw new Error('Invalid time range');
    }

    const [
      usersData,
      certificatesData,
      apiCallsData,
      errorsData,
    ] = await Promise.all([
      // Get user statistics
      supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),

      // Get certificate statistics
      supabase
        .from('certificates')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),

      // Get API call statistics
      supabase
        .from('api_logs')
        .select('created_at, response_time')
        .gte('created_at', startDate.toISOString()),

      // Get error statistics
      supabase
        .from('error_logs')
        .select('created_at, error_type')
        .gte('created_at', startDate.toISOString()),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: usersData.data,
        certificates: certificatesData.data,
        apiCalls: apiCallsData.data,
        errors: errorsData.data,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}
