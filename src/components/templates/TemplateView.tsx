import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { useAuth } from '../auth/AuthProvider';
import { PreviewMode } from './PreviewMode';
import { PDFPreview } from './PDFPreview';

interface Template {
  id: string;
  name: string;
  description: string;
  design_data: {
    elements: Array<{
      id: string;
      type: string;
      content: string;
      position: { x: number; y: number };
      style?: Record<string, string>;
    }>;
    properties: {
      size: {
        width: number;
        height: number;
        unit: 'mm' | 'in' | 'px';
      };
      orientation: 'portrait' | 'landscape';
      background: {
        type: 'color' | 'image';
        value: string;
      };
      margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        unit: 'mm' | 'in' | 'px';
      };
      padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        unit: 'mm' | 'in' | 'px';
      };
    };
  };
  is_public: boolean;
  created_at: string;
  updated_at: string;
  public_url?: string;
}

export function TemplateView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const { data: template, isLoading, error } = useQuery<Template>({
    queryKey: ['template', id],
    queryFn: async () => {
      if (!auth.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .eq('user_id', auth.session.user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Template not found');

      // Get the public URL for the template
      let publicUrl = data.public_url;
      if (!publicUrl && data.storage_path) {
        const { data: { publicUrl: url } } = await supabase
          .storage
          .from('templates')
          .getPublicUrl(data.storage_path);
        publicUrl = url;
        console.log('Generated public URL:', publicUrl);
      }

      // Ensure design_data has the correct structure
      return {
        ...data,
        public_url: publicUrl,
        design_data: {
          elements: data.design_data?.elements || [],
          properties: data.design_data?.properties || {
            size: { width: 210, height: 297, unit: 'mm' },
            orientation: 'portrait',
            background: { type: 'color', value: '#ffffff' },
            margins: { top: 0, right: 0, bottom: 0, left: 0, unit: 'mm' },
            padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'mm' },
          },
        },
      };
    },
    enabled: !!auth.session?.user && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Failed to load template'}
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/dashboard/templates')}>
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Template Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The template you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/dashboard/templates')}>
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
            {template.description && (
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            )}
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => navigate('/dashboard/templates')}
              variant="secondary"
            >
              Back
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              variant="primary"
            >
              Preview
            </Button>
            <Button
              onClick={() => navigate(`/dashboard/templates/${id}/edit`)}
              variant="primary"
            >
              Edit Template
            </Button>
          </div>
        </div>

        {/* Template Preview */}
        <div className="bg-white rounded-lg shadow-sm relative mx-auto overflow-hidden">
          {template.public_url ? (
            <>
              <div className="text-sm text-gray-500 mb-4">
                Loading template from: {template.public_url}
              </div>
              <PDFPreview url={template.public_url} className="max-w-full" />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No preview available - template file not found</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewMode
          elements={template.design_data.elements}
          properties={template.design_data.properties}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
