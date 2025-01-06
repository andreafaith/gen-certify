import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

interface FieldTemplate {
  id: string;
  name: string;
  display_name: string;
  field_type: 'text' | 'date' | 'number' | 'select' | 'multi-select' | 'url' | 'email';
  options?: string[];
  default_value?: string;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min?: number;
    max?: number;
    format?: string;
  };
  category: 'personal' | 'organization' | 'academic' | 'professional' | 'achievement' | 'other';
  description?: string;
  is_required: boolean;
}

interface DynamicFieldProps {
  template: FieldTemplate;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  template,
  value,
  onChange,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleMultiSelectChange = (selectedValue: string) => {
    const currentValues = value ? JSON.parse(value) as string[] : [];
    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter(v => v !== selectedValue)
      : [...currentValues, selectedValue];
    onChange(JSON.stringify(newValues));
  };

  switch (template.field_type) {
    case 'text':
    case 'email':
    case 'url':
      return (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={template.field_type}
            value={value || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? 'border-red-300' : ''
            }`}
            required={template.is_required}
            pattern={template.validation_rules?.pattern}
            minLength={template.validation_rules?.min_length}
            maxLength={template.validation_rules?.max_length}
          />
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? 'border-red-300' : ''
            }`}
            required={template.is_required}
            min={template.validation_rules?.min}
            max={template.validation_rules?.max}
          />
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? 'border-red-300' : ''
            }`}
            required={template.is_required}
          />
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? 'border-red-300' : ''
            }`}
            required={template.is_required}
          >
            <option value="">Select {template.display_name}</option>
            {template.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'multi-select':
      const selectedValues = value ? JSON.parse(value) as string[] : [];
      return (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </label>
          <div className="mt-2 space-y-2">
            {template.options?.map((option) => (
              <label key={option} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleMultiSelectChange(option)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    default:
      return null;
  }
};

interface DynamicFieldsProps {
  category?: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string>;
}

export const DynamicFields: React.FC<DynamicFieldsProps> = ({
  category,
  values,
  onChange,
  errors = {}
}) => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['fieldTemplates', category],
    queryFn: async () => {
      const query = supabase
        .from('field_templates')
        .select('*')
        .order('display_name');

      if (category) {
        query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FieldTemplate[];
    }
  });

  if (isLoading) {
    return <div>Loading fields...</div>;
  }

  return (
    <div className="space-y-6">
      {templates?.map((template) => (
        <DynamicField
          key={template.id}
          template={template}
          value={values[template.name] || ''}
          onChange={(value) =>
            onChange({ ...values, [template.name]: value })
          }
          error={errors[template.name]}
        />
      ))}
    </div>
  );
};
