import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import type { TemplateFormData } from './types';

interface TemplateFormProps {
  data: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onSubmit: (data: TemplateFormData) => void;
  isLoading: boolean;
}

export function TemplateForm({ data, onChange, onSubmit, isLoading }: TemplateFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Template Name"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={data.isPublic}
          onChange={(e) => onChange({ ...data, isPublic: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
          Make this template public
        </label>
      </div>

      <Button type="submit" loading={isLoading}>
        Save Template
      </Button>
    </form>
  );
}