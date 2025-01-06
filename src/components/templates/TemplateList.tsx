import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TemplateCard } from './TemplateCard';
import {
  PlusIcon,
  Bars4Icon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../auth/AuthProvider';

interface Template {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'created_at' | 'updated_at';
type ViewMode = 'grid' | 'list';
type SortDirection = 'asc' | 'desc';

export function TemplateList() {
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', sortField, sortDirection],
    queryFn: async () => {
      if (!auth.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', auth.session.user.id)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      return data as Template[];
    },
    enabled: !!auth.session?.user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!auth.session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', auth.session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleDelete = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Certificate Templates</h2>
        <Button onClick={() => navigate('/dashboard/templates/new')}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* View and Sort Controls */}
        <div className="flex gap-2">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-r-md border-t border-r border-b ${
                viewMode === 'list'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bars4Icon className="h-5 w-5" />
            </button>
          </div>

          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="updated_at-desc">Recently Updated</option>
            <option value="updated_at-asc">Least Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {templates.length === 0
              ? 'Get started by creating a new template'
              : 'Try adjusting your search'}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={viewMode === 'list' ? 'bg-white rounded-lg shadow hover:shadow-md transition-shadow' : ''}
            >
              <div 
                className={`cursor-pointer ${viewMode === 'list' ? 'p-4' : ''}`}
                onClick={() => navigate(`/dashboard/templates/${template.id}/edit`)}
              >
                {viewMode === 'grid' ? (
                  <TemplateCard template={template} onDelete={() => handleDelete(template.id)} />
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      {template.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{template.description}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(template.created_at).toLocaleDateString()}
                      <Button onClick={() => handleDelete(template.id)} className="ml-2">
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}