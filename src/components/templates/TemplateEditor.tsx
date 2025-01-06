import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../auth/AuthProvider';
import { ElementToolbar } from './elements/ElementToolbar';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { ShapeElement } from './elements/ShapeElement';
import { PlaceholderElement } from './elements/PlaceholderElement';
import { TemplateProperties } from './TemplateProperties';
import { PreviewMode } from './PreviewMode';
import debounce from 'lodash.debounce';

interface Element {
  id: string;
  type: 'text' | 'image' | 'shape' | 'placeholder';
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  design_data: {
    elements: Element[];
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
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);

  const { data: templateData, isLoading, error: queryError } = useQuery<Template>({
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

      // Ensure design_data has the correct structure
      const template: Template = {
        ...data,
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

      return template;
    },
    enabled: !!auth.session?.user && !!id,
  });

  useEffect(() => {
    if (templateData) {
      setTemplate(templateData);
    }
  }, [templateData]);

  const updateMutation = useMutation({
    mutationFn: async (updatedTemplate: Template) => {
      if (!auth.session?.user) throw new Error('Not authenticated');

      // Ensure padding is included in the design_data
      const templateWithPadding = {
        ...updatedTemplate,
        design_data: {
          ...updatedTemplate.design_data,
          properties: {
            ...updatedTemplate.design_data.properties,
            padding: updatedTemplate.design_data.properties.padding || {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              unit: updatedTemplate.design_data.properties.margins.unit,
            },
          },
        },
      };

      try {
        console.log('Saving template:', templateWithPadding);
        const { data, error } = await supabase
          .from('templates')
          .update({
            name: templateWithPadding.name,
            description: templateWithPadding.description,
            design_data: templateWithPadding.design_data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateWithPadding.id)
          .eq('user_id', auth.session.user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error saving template:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setLastSaved(new Date());
      queryClient.setQueryData(['template', id], data);
      setTemplate(data);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      setError('Failed to save template. Please try again.');
      // toast.error('Failed to save template. Please try again.');
    },
  });

  // Auto-save debounced update function
  const debouncedUpdate = useMemo(
    () =>
      debounce((template: Template) => {
        if (!template?.id) return;
        
        // Only update if there are actual changes
        const currentTemplate = queryClient.getQueryData<Template>(['template', template.id]);
        if (JSON.stringify(currentTemplate) === JSON.stringify(template)) {
          return;
        }

        console.log('Debounced update triggered for template:', template.id);
        updateMutation.mutate(template);
      }, 2000), // Increased debounce time to 2 seconds
    [queryClient, updateMutation]
  );

  // Handle template updates
  const handleTemplateUpdate = useCallback((updates: Partial<Template>) => {
    if (!template) return;

    const updatedTemplate = {
      ...template,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setTemplate(updatedTemplate);
    debouncedUpdate(updatedTemplate);
  }, [template, debouncedUpdate]);

  // Handle element updates
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<Element>) => {
    if (!template) return;

    const updatedElements = template.design_data.elements.map(element =>
      element.id === elementId
        ? { ...element, ...updates }
        : element
    );

    const updatedTemplate = {
      ...template,
      design_data: {
        ...template.design_data,
        elements: updatedElements,
      },
      updated_at: new Date().toISOString(),
    };

    setTemplate(updatedTemplate);
    debouncedUpdate(updatedTemplate);
  }, [template, debouncedUpdate]);

  const handleAddElement = (type: 'text' | 'image' | 'shape' | 'placeholder') => {
    if (!template) return;

    // Calculate a good starting position - center of the viewport
    const editorRect = document.getElementById('template-editor')?.getBoundingClientRect();
    const startX = (editorRect?.width || 800) / 2 - 100;
    const startY = (editorRect?.height || 600) / 2 - 100;

    const newElement: Element = {
      id: crypto.randomUUID(),
      type,
      content: type === 'placeholder' ? '{{recipient.name}}' : '',
      position: { x: startX, y: startY },
      style: type === 'image' ? { width: '200px', height: '200px' } : undefined,
    };

    // Update local state immediately
    const updatedTemplate = {
      ...template,
      design_data: {
        ...template.design_data,
        elements: [...template.design_data.elements, newElement],
      },
      updated_at: new Date().toISOString(),
    };

    setTemplate(updatedTemplate);
    queryClient.setQueryData(['template', id], updatedTemplate);
    debouncedUpdate(updatedTemplate);
  };

  const handleDeleteElement = (elementId: string) => {
    if (!template) return;

    const updatedElements = template.design_data.elements.filter(
      (element) => element.id !== elementId
    );

    // Update local state immediately
    const updatedTemplate = {
      ...template,
      design_data: {
        ...template.design_data,
        elements: updatedElements,
      },
      updated_at: new Date().toISOString(),
    };

    setTemplate(updatedTemplate);
    queryClient.setQueryData(['template', id], updatedTemplate);
    debouncedUpdate(updatedTemplate);
  };

  const handleUpdateProperties = (properties: Template['design_data']['properties']) => {
    if (!template) return;

    const updatedTemplate = {
      ...template,
      design_data: {
        ...template.design_data,
        properties,
      },
      updated_at: new Date().toISOString(),
    };

    setTemplate(updatedTemplate);
    queryClient.setQueryData(['template', id], updatedTemplate);
    debouncedUpdate(updatedTemplate);
  };

  useEffect(() => {
    return () => {
      debouncedUpdate.flush();
    };
  }, [debouncedUpdate]);

  const handleSave = async () => {
    if (!template) return;
    
    try {
      await updateMutation.mutateAsync(template);
      // toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      // toast.error('Failed to save template. Please try again.');
    }
  };

  if (queryError) {
    console.error('Query error:', queryError);
    return (
      <div className="p-4">
        <h2 className="text-red-600 text-lg font-semibold">Error Loading Template</h2>
        <p className="text-gray-600">{queryError.message}</p>
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard/templates')}
          className="mt-4"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4">
        <h2 className="text-red-600 text-lg font-semibold">Template Not Found</h2>
        <p className="text-gray-600">The requested template could not be found.</p>
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard/templates')}
          className="mt-4"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Template</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add and arrange elements to create your template
                {lastSaved && (
                  <span className="ml-2 text-gray-400">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowPreview(true)}
                variant="secondary"
              >
                Preview
              </Button>
              <Button onClick={() => navigate(`/dashboard/templates/${id}`)}>
                Done
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <ElementToolbar onAddElement={handleAddElement} />
            </div>

            <div className="grid grid-cols-4 gap-6">
              {/* Template Properties Sidebar */}
              <div className="col-span-1 border-r p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Template Properties</h3>
                <TemplateProperties
                  properties={template.design_data.properties}
                  onChange={handleUpdateProperties}
                />
              </div>

              {/* Canvas Area */}
              <div className="col-span-3 p-6 overflow-auto">
                <div
                  className="bg-white border rounded-lg shadow-sm relative mx-auto"
                  style={{
                    width: `${template.design_data.properties.size.width * 96}px`,
                    height: `${template.design_data.properties.size.height * 96}px`,
                    margin: '0 auto',
                    background: template.design_data.properties.background.type === 'color'
                      ? template.design_data.properties.background.value
                      : `url(${template.design_data.properties.background.value}) center/cover no-repeat`,
                    transform: template.design_data.properties.orientation === 'landscape' ? 'rotate(90deg)' : 'none',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      margin: `${template.design_data.properties.margins.top * 96}px ${template.design_data.properties.margins.right * 96}px ${template.design_data.properties.margins.bottom * 96}px ${template.design_data.properties.margins.left * 96}px`,
                      padding: `${template.design_data.properties.padding.top * 96}px ${template.design_data.properties.padding.right * 96}px ${template.design_data.properties.padding.bottom * 96}px ${template.design_data.properties.padding.left * 96}px`,
                    }}
                  >
                    {template.design_data.elements.map((element) => {
                      switch (element.type) {
                        case 'text':
                          return (
                            <TextElement
                              key={element.id}
                              {...element}
                              onUpdate={handleElementUpdate}
                              onDelete={handleDeleteElement}
                            />
                          );
                        case 'image':
                          return (
                            <ImageElement
                              key={element.id}
                              {...element}
                              onUpdate={handleElementUpdate}
                              onDelete={handleDeleteElement}
                            />
                          );
                        case 'shape':
                          return (
                            <ShapeElement
                              key={element.id}
                              {...element}
                              onUpdate={handleElementUpdate}
                              onDelete={handleDeleteElement}
                            />
                          );
                        case 'placeholder':
                          return (
                            <PlaceholderElement
                              key={element.id}
                              {...element}
                              onUpdate={handleElementUpdate}
                              onDelete={handleDeleteElement}
                            />
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewMode
          elements={template.design_data.elements}
          properties={template.design_data.properties}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
