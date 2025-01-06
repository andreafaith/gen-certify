import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Database } from '../../types/supabase';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useDeleteTemplate } from './hooks/useDeleteTemplate';
import { DuplicateTemplateButton } from './DuplicateTemplateButton';

type Template = Database['public']['Tables']['templates']['Row'];

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    created_at: string;
  };
  onDelete: () => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteTemplate, isLoading: isDeleting } = useDeleteTemplate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/templates/${template.id}/edit`);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/templates/${template.id}`);
  };

  const handleDelete = () => {
    deleteTemplate(template.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onDelete();
      },
    });
  };

  return (
    <div 
      className="bg-white overflow-hidden shadow rounded-lg cursor-pointer" 
      onClick={handleView}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          </div>
          <div className="flex gap-2">
            <DuplicateTemplateButton 
              templateId={template.id} 
              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
            />
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Created {new Date(template.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}