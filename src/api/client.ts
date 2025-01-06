import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse,
  PaginationParams,
  TemplateCreateParams,
  TemplateUpdateParams,
  CertificateGenerateParams,
  CertificateBatchGenerateParams,
  UserUpdateParams,
  EmailTemplateParams,
  SystemSettingParams,
} from './types';

class ApiClient {
  private async request<T>(
    endpoint: string,
    method: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const requestId = uuidv4();

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Unauthorized');
      }

      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'X-Request-ID': requestId,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      const endTime = performance.now();

      // Log API call
      await supabase.rpc('log_api_call', {
        p_user_id: session.data.session.user.id,
        p_endpoint: endpoint,
        p_method: method,
        p_status_code: response.status,
        p_response_time: endTime - startTime,
      });

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTime: endTime - startTime,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      
      // Log error
      if (error instanceof Error) {
        await supabase.rpc('log_error', {
          p_user_id: (await supabase.auth.getSession()).data.session?.user.id,
          p_error_type: error.name,
          p_error_message: error.message,
          p_stack_trace: error.stack,
          p_metadata: { endpoint, method },
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTime: endTime - startTime,
        },
      };
    }
  }

  // Template endpoints
  async getTemplates(params?: PaginationParams): Promise<ApiResponse> {
    return this.request('templates', 'GET', params);
  }

  async getTemplate(id: string): Promise<ApiResponse> {
    return this.request(`templates/${id}`, 'GET');
  }

  async createTemplate(params: TemplateCreateParams): Promise<ApiResponse> {
    return this.request('templates', 'POST', params);
  }

  async updateTemplate(params: TemplateUpdateParams): Promise<ApiResponse> {
    return this.request(`templates/${params.id}`, 'PUT', params);
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    return this.request(`templates/${id}`, 'DELETE');
  }

  // Certificate endpoints
  async generateCertificate(params: CertificateGenerateParams): Promise<ApiResponse> {
    return this.request('certificates/generate', 'POST', params);
  }

  async generateCertificateBatch(params: CertificateBatchGenerateParams): Promise<ApiResponse> {
    return this.request('certificates/generate-batch', 'POST', params);
  }

  async getCertificates(params?: PaginationParams): Promise<ApiResponse> {
    return this.request('certificates', 'GET', params);
  }

  async getCertificate(id: string): Promise<ApiResponse> {
    return this.request(`certificates/${id}`, 'GET');
  }

  async deleteCertificate(id: string): Promise<ApiResponse> {
    return this.request(`certificates/${id}`, 'DELETE');
  }

  // User management endpoints
  async getUsers(params?: PaginationParams): Promise<ApiResponse> {
    return this.request('users', 'GET', params);
  }

  async getUser(id: string): Promise<ApiResponse> {
    return this.request(`users/${id}`, 'GET');
  }

  async updateUser(id: string, params: UserUpdateParams): Promise<ApiResponse> {
    return this.request(`users/${id}`, 'PUT', params);
  }

  async getUserActivity(id: string, params?: PaginationParams): Promise<ApiResponse> {
    return this.request(`users/${id}/activity`, 'GET', params);
  }

  // Email template endpoints
  async getEmailTemplates(params?: PaginationParams): Promise<ApiResponse> {
    return this.request('email-templates', 'GET', params);
  }

  async getEmailTemplate(id: string): Promise<ApiResponse> {
    return this.request(`email-templates/${id}`, 'GET');
  }

  async createEmailTemplate(params: EmailTemplateParams): Promise<ApiResponse> {
    return this.request('email-templates', 'POST', params);
  }

  async updateEmailTemplate(id: string, params: EmailTemplateParams): Promise<ApiResponse> {
    return this.request(`email-templates/${id}`, 'PUT', params);
  }

  async deleteEmailTemplate(id: string): Promise<ApiResponse> {
    return this.request(`email-templates/${id}`, 'DELETE');
  }

  // System settings endpoints
  async getSystemSettings(): Promise<ApiResponse> {
    return this.request('settings', 'GET');
  }

  async updateSystemSetting(key: string, params: SystemSettingParams): Promise<ApiResponse> {
    return this.request(`settings/${key}`, 'PUT', params);
  }

  // Analytics endpoints
  async getUsageStatistics(timeRange: 'day' | 'week' | 'month'): Promise<ApiResponse> {
    return this.request(`analytics/usage?timeRange=${timeRange}`, 'GET');
  }

  async getSystemPerformance(timeRange: 'day' | 'week' | 'month'): Promise<ApiResponse> {
    return this.request(`analytics/performance?timeRange=${timeRange}`, 'GET');
  }

  async getErrorStats(timeRange: 'day' | 'week' | 'month'): Promise<ApiResponse> {
    return this.request(`analytics/errors?timeRange=${timeRange}`, 'GET');
  }
}

export const apiClient = new ApiClient();
