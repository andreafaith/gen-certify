import React, { useState } from 'react';
import { DynamicFields } from './DynamicField';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

interface CertificateFormProps {
  certificateId?: string;
  onSubmit: (values: Record<string, string>) => void;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  certificateId,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tabs = [
    { id: 'personal', name: 'Personal Information' },
    { id: 'course', name: 'Course Information' },
    { id: 'dates', name: 'Dates' },
    { id: 'performance', name: 'Performance' },
    { id: 'certification', name: 'Certification Details' },
    { id: 'additional', name: 'Additional Information' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const { data: templates } = await supabase
      .from('field_templates')
      .select('*');

    const newErrors: Record<string, string> = {};
    templates?.forEach((template) => {
      const value = values[template.name];
      if (template.is_required && (!value || value.trim() === '')) {
        newErrors[template.name] = `${template.display_name} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Fields */}
      <div className="mt-4">
        <DynamicFields
          category={activeTab}
          values={values}
          onChange={setValues}
          errors={errors}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-5">
        <button
          type="button"
          onClick={() => {
            const currentIndex = tabs.findIndex(t => t.id === activeTab);
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1].id);
            }
          }}
          className="rounded-md bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={activeTab === tabs[0].id}
        >
          Previous
        </button>

        {activeTab === tabs[tabs.length - 1].id ? (
          <button
            type="submit"
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Certificate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const currentIndex = tabs.findIndex(t => t.id === activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1].id);
              }
            }}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Next
          </button>
        )}
      </div>
    </form>
  );
};
