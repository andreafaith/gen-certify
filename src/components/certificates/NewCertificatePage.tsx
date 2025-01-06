import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DashboardLayout } from '../layout/DashboardLayout';

interface Template {
  id: string;
  name: string;
}

export function NewCertificatePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }

    fetchTemplates();
  }, [session]);

  const fetchTemplates = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('user_id', session?.user?.id);

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: createError } = await supabase
        .from('certificates')
        .insert([
          {
            title,
            recipient_name: recipientName,
            issue_date: new Date(issueDate).toISOString(),
            template_id: selectedTemplateId,
            user_id: session?.user?.id,
          },
        ]);

      if (createError) throw createError;
      navigate('/dashboard/certificates');
    } catch (err) {
      console.error('Error creating certificate:', err);
      setError('Failed to create certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Create New Certificate</h1>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div>
              <Input
                label="Certificate Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Recipient Name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Issue Date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard/certificates')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Certificate
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
