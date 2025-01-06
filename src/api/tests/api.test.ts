import { apiClient } from '../client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';

describe('API Integration Tests', () => {
  let testUserId: string;
  let testTemplateId: string;

  beforeEach(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.signUp({
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
    });
    if (error) throw error;
    testUserId = user!.id;

    // Create test template
    const { data, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: 'Test Template',
        content: '<div>Test Content</div>',
        user_id: testUserId,
      })
      .select()
      .single();
    if (templateError) throw templateError;
    testTemplateId = data.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('templates').delete().eq('id', testTemplateId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('Template Management', () => {
    it('should get templates with pagination', async () => {
      const response = await apiClient.getTemplates({ page: 1, limit: 10 });
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.items)).toBe(true);
    });

    it('should get a single template', async () => {
      const response = await apiClient.getTemplate(testTemplateId);
      expect(response.success).toBe(true);
      expect(response.data?.id).toBe(testTemplateId);
    });
  });

  describe('Certificate Generation', () => {
    it('should generate a certificate', async () => {
      const response = await apiClient.generateCertificate({
        templateId: testTemplateId,
        data: { name: 'John Doe' },
        outputFormat: 'pdf',
      });
      expect(response.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const requests = Array(150).fill(null).map(() => 
        apiClient.getTemplate(testTemplateId)
      );
      
      const results = await Promise.allSettled(requests);
      const rateLimited = results.some(result => 
        result.status === 'rejected' && 
        result.reason.message === 'Rate limit exceeded'
      );
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid template ID', async () => {
      const response = await apiClient.getTemplate('invalid-id');
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    it('should handle unauthorized access', async () => {
      // Sign out to test unauthorized access
      await supabase.auth.signOut();
      const response = await apiClient.getTemplate(testTemplateId);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Unauthorized');
    });
  });
});
