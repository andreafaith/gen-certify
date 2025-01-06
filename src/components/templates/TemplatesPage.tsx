import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Template {
  id: string;
  name: string;
  created_at: string;
  description: string | null;
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Templates
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => navigate('/dashboard/templates/new')}>
            Create Template
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
              <div 
                className="p-6 cursor-pointer"
                onClick={() => navigate(`/dashboard/templates/${template.id}`)}
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new template
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/dashboard/templates/new')}>
                  Create Template
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
