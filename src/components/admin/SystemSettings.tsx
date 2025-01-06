import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: 'general' | 'email' | 'api' | 'security' | 'storage';
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  updated_at: string;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<SystemSetting['category']>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchEmailTemplates();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setEmailTemplates(data || []);
    } catch (err) {
      console.error('Error fetching email templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email templates');
    }
  };

  const updateSetting = async (id: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: newValue })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      await fetchSettings();
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  const updateEmailTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchEmailTemplates();
    } catch (err) {
      console.error('Error updating email template:', err);
      setError(err instanceof Error ? err.message : 'Failed to update email template');
    }
  };

  const renderSettingValue = (setting: SystemSetting) => {
    if (editingId === setting.id) {
      if (typeof setting.value === 'boolean') {
        return (
          <select
            value={setting.value.toString()}
            onChange={(e) => updateSetting(setting.id, e.target.value === 'true')}
            className="rounded border-gray-300"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      }

      if (Array.isArray(setting.value)) {
        return (
          <input
            type="text"
            value={setting.value.join(', ')}
            onChange={(e) => updateSetting(setting.id, e.target.value.split(',').map(s => s.trim()))}
            className="rounded border-gray-300"
          />
        );
      }

      if (typeof setting.value === 'number') {
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => updateSetting(setting.id, parseFloat(e.target.value))}
            className="rounded border-gray-300"
          />
        );
      }

      return (
        <input
          type="text"
          value={JSON.stringify(setting.value)}
          onChange={(e) => {
            try {
              const value = JSON.parse(e.target.value);
              updateSetting(setting.id, value);
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          className="rounded border-gray-300"
        />
      );
    }

    return (
      <div onClick={() => setEditingId(setting.id)} className="cursor-pointer">
        {JSON.stringify(setting.value)}
      </div>
    );
  };

  const renderEmailTemplates = () => (
    <div className="space-y-6">
      {emailTemplates.map((template) => (
        <div key={template.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* TODO: Implement template preview */}}
            >
              Preview
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => updateEmailTemplate(template.id, { subject: e.target.value })}
                className="mt-1 block w-full rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={template.content}
                onChange={(e) => updateEmailTemplate(template.id, { content: e.target.value })}
                rows={6}
                className="mt-1 block w-full rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Variables</label>
              <input
                type="text"
                value={template.variables.join(', ')}
                onChange={(e) => updateEmailTemplate(template.id, {
                  variables: e.target.value.split(',').map(v => v.trim())
                })}
                className="mt-1 block w-full rounded border-gray-300"
              />
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(template.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <Button onClick={fetchSettings}>Refresh</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          variant={activeCategory === 'general' ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('general')}
        >
          General
        </Button>
        <Button
          variant={activeCategory === 'email' ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('email')}
        >
          Email
        </Button>
        <Button
          variant={activeCategory === 'api' ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('api')}
        >
          API
        </Button>
        <Button
          variant={activeCategory === 'security' ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('security')}
        >
          Security
        </Button>
        <Button
          variant={activeCategory === 'storage' ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('storage')}
        >
          Storage
        </Button>
      </div>

      {activeCategory === 'email' ? (
        renderEmailTemplates()
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings
                .filter(setting => setting.category === activeCategory)
                .map((setting) => (
                  <tr key={setting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {setting.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderSettingValue(setting)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {setting.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(setting.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
