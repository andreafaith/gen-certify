import { Database } from '../types/supabase';

export type Tables = Database['public']['Tables'];

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface TemplateCreateParams {
  name: string;
  content: string;
  variables: string[];
  settings: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    margin: number;
  };
}

export interface TemplateUpdateParams extends Partial<TemplateCreateParams> {
  id: string;
}

export interface CertificateGenerateParams {
  templateId: string;
  data: Record<string, any>;
  outputFormat: 'pdf' | 'png' | 'jpg';
  settings?: {
    quality?: number;
    dpi?: number;
    compression?: boolean;
  };
}

export interface CertificateBatchGenerateParams {
  templateId: string;
  dataList: Record<string, any>[];
  outputFormat: 'pdf' | 'png' | 'jpg';
  settings?: {
    quality?: number;
    dpi?: number;
    compression?: boolean;
    batchSize?: number;
  };
}

export interface UserUpdateParams {
  email?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'suspended' | 'pending' | 'deactivated';
  metadata?: Record<string, any>;
}

export interface EmailTemplateParams {
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export interface SystemSettingParams {
  key: string;
  value: any;
  description: string;
  category: 'general' | 'email' | 'api' | 'security' | 'storage';
}
