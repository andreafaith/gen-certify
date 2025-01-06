import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../auth/AuthProvider';

export function NewTemplatePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .insert([
          {
            name,
            description,
            user_id: auth.session.user.id,
            design_data: {
              elements: [],
              properties: {
                size: {
                  width: 8.5,
                  height: 11,
                  unit: 'in'
                },
                orientation: 'portrait',
                background: {
                  type: 'color',
                  value: '#ffffff'
                },
                margins: {
                  top: 0.5,
                  right: 0.5,
                  bottom: 0.5,
                  left: 0.5,
                  unit: 'in'
                },
                padding: {
                  top: 0.25,
                  right: 0.25,
                  bottom: 0.25,
                  left: 0.25,
                  unit: 'in'
                },
                bleed: {
                  top: 0.125,
                  right: 0.125,
                  bottom: 0.125,
                  left: 0.125,
                  unit: 'in'
                },
                safeZone: {
                  top: 0.25,
                  right: 0.25,
                  bottom: 0.25,
                  left: 0.25,
                  unit: 'in'
                }
              }
            },
            is_public: false
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');
      
      navigate(`/dashboard/templates/${data.id}/edit`);
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create New Template
          </h2>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dashboard/templates')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}
