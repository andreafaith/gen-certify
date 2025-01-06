import React, { useEffect, useState, Suspense, lazy } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

const MonacoEditor = lazy(() => import('@monaco-editor/react').then(mod => ({
  default: mod.Editor
})));

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: Record<string, string>;
  is_active: boolean;
  updated_at: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert({
          id: template.id,
          name: template.name,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          is_active: template.is_active,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchTemplates();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const createTemplate = async () => {
    const newTemplate: Partial<EmailTemplate> = {
      name: 'New Template',
      subject: 'New Subject',
      content: 'Hello {{name}},\n\nYour message here.\n\nBest regards,\nThe Team',
      variables: { name: 'Recipient Name' },
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;
      await fetchTemplates();
      setSelectedTemplate(data);
      setIsEditing(true);
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTemplates();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Template List */}
      <div className="col-span-1 bg-white shadow-md rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button onClick={createTemplate}>New Template</Button>
        </div>
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-3 rounded-md cursor-pointer ${
                selectedTemplate?.id === template.id
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedTemplate(template);
                setIsEditing(false);
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{template.name}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">{template.subject}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className="col-span-2 bg-white shadow-md rounded-lg p-4">
        {selectedTemplate ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {isEditing ? 'Edit Template' : 'Template Details'}
              </h2>
              <div className="space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveTemplate(selectedTemplate)}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => deleteTemplate(selectedTemplate.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedTemplate.name}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                ) : (
                  <div className="mt-1">{selectedTemplate.name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                ) : (
                  <div className="mt-1">{selectedTemplate.subject}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                {isEditing ? (
                  <Suspense fallback={
                    <textarea
                      value={selectedTemplate.content}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          content: e.target.value,
                        })
                      }
                      className="mt-1 block w-full h-64 rounded-md border-gray-300 shadow-sm font-mono"
                    />
                  }>
                    <MonacoEditor
                      height="300px"
                      defaultLanguage="html"
                      value={selectedTemplate.content}
                      onChange={(value) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          content: value || '',
                        })
                      }
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                      }}
                    />
                  </Suspense>
                ) : (
                  <pre className="mt-1 p-4 bg-gray-50 rounded-md overflow-auto">
                    {selectedTemplate.content}
                  </pre>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Variables
                </label>
                <div className="mt-1 p-4 bg-gray-50 rounded-md">
                  {Object.entries(selectedTemplate.variables).map(([key, desc]) => (
                    <div key={key} className="flex justify-between items-center">
                      <code className="text-sm">{'{{' + key + '}}'}</code>
                      <span className="text-sm text-gray-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.is_active}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        is_active: e.target.checked,
                      })
                    }
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            Select a template to view or edit its details
          </div>
        )}
      </div>
    </div>
  );
}
