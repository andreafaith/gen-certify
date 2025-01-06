import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

interface FieldMapping {
  id: string;
  name: string;
  template_id: string;
  mapping: Record<string, string>;
  default_values: Record<string, string>;
  transformations: Record<string, {
    type: string;
    value: string;
  }>;
}

interface TransformationOption {
  type: string;
  label: string;
  hasValue: boolean;
}

const TRANSFORMATION_OPTIONS: TransformationOption[] = [
  { type: 'uppercase', label: 'Convert to Uppercase', hasValue: false },
  { type: 'lowercase', label: 'Convert to Lowercase', hasValue: false },
  { type: 'trim', label: 'Trim Whitespace', hasValue: false },
  { type: 'prefix', label: 'Add Prefix', hasValue: true },
  { type: 'suffix', label: 'Add Suffix', hasValue: true },
  { type: 'replace', label: 'Replace Text', hasValue: true },
  { type: 'dateFormat', label: 'Format Date', hasValue: true },
];

export function FieldMapping() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [csvColumns, setCSVColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [currentMapping, setCurrentMapping] = useState<FieldMapping | null>(null);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // First get all templates
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select('id, name');

        if (templateError) {
          setError(templateError.message);
          return;
        }

        // Then get field templates
        const { data: fieldData, error: fieldError } = await supabase
          .from('field_templates')
          .select(`
            id,
            name,
            display_name,
            field_type,
            options,
            validation_rules
          `)
          .eq('is_system', true);

        if (fieldError) {
          setError(fieldError.message);
          return;
        }

        // Map the templates with their available fields
        setTemplates(templateData.map(template => ({
          id: template.id,
          name: template.name,
          fields: fieldData.map(field => ({
            id: field.id,
            name: field.display_name,
            type: field.field_type
          }))
        })));
      } catch (err) {
        setError('Error fetching templates');
        console.error('Error:', err);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch distinct CSV columns from uploaded data
        const { data: csvData, error: csvError } = await supabase
          .from('csv_data')
          .select('*')
          .limit(1);

        if (csvError) throw csvError;
        if (csvData && csvData.length > 0) {
          setCSVColumns(Object.keys(csvData[0]).filter(col => 
            !['id', 'user_id', 'created_at', 'updated_at'].includes(col)
          ));
        }
      } catch (err) {
        setError('Error fetching data: ' + (err as Error).message);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchMappings = async () => {
      if (!user || !selectedTemplate) return;

      try {
        const { data: mappingsData, error: mappingsError } = await supabase
          .from('field_mappings')
          .select('*')
          .eq('template_id', selectedTemplate);

        if (mappingsError) throw mappingsError;
        setMappings(mappingsData || []);
      } catch (err) {
        setError('Error fetching mappings: ' + (err as Error).message);
      }
    };

    fetchMappings();
  }, [user, selectedTemplate]);

  const handleCreateMapping = async () => {
    if (!user || !selectedTemplate) return;

    try {
      const { data, error: createError } = await supabase
        .from('field_mappings')
        .insert({
          user_id: user.id,
          template_id: selectedTemplate,
          name: 'New Mapping',
          mapping: {},
          default_values: {},
          transformations: {},
        })
        .select()
        .single();

      if (createError) throw createError;
      if (data) {
        setMappings([...mappings, data]);
        setCurrentMapping(data);
      }
    } catch (err) {
      setError('Error creating mapping: ' + (err as Error).message);
    }
  };

  const handleUpdateMapping = async (
    mappingId: string,
    updates: Partial<FieldMapping>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('field_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        setMappings(mappings.map(m => m.id === mappingId ? data : m));
        setCurrentMapping(data);
      }
    } catch (err) {
      setError('Error updating mapping: ' + (err as Error).message);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('field_mappings')
        .delete()
        .eq('id', mappingId);

      if (deleteError) throw deleteError;
      setMappings(mappings.filter(m => m.id !== mappingId));
      if (currentMapping?.id === mappingId) {
        setCurrentMapping(null);
      }
    } catch (err) {
      setError('Error deleting mapping: ' + (err as Error).message);
    }
  };

  const handleFieldMap = (field: string, csvColumn: string) => {
    if (!currentMapping) return;

    const newMapping = {
      ...currentMapping.mapping,
      [field]: csvColumn,
    };

    handleUpdateMapping(currentMapping.id, { mapping: newMapping });
  };

  const handleDefaultValue = (field: string, value: string) => {
    if (!currentMapping) return;

    const newDefaults = {
      ...currentMapping.default_values,
      [field]: value,
    };

    handleUpdateMapping(currentMapping.id, { default_values: newDefaults });
  };

  const handleTransformation = (
    field: string,
    type: string,
    value: string = ''
  ) => {
    if (!currentMapping) return;

    const newTransformations = {
      ...currentMapping.transformations,
      [field]: { type, value },
    };

    handleUpdateMapping(currentMapping.id, { transformations: newTransformations });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Field Mapping</h2>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <select
          className="w-full border rounded-md p-2"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          <option value="">Select a template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {selectedTemplate && (
        <div className="grid grid-cols-4 gap-6">
          {/* Mappings List */}
          <div className="col-span-1 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Mappings</h3>
              <button
                onClick={handleCreateMapping}
                className="p-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className={`flex justify-between items-center p-2 rounded-md cursor-pointer
                    ${currentMapping?.id === mapping.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setCurrentMapping(mapping)}
                >
                  <span>{mapping.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMapping(mapping.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mapping Configuration */}
          {currentMapping && (
            <div className="col-span-3 border rounded-md p-4">
              <div className="mb-4">
                <input
                  type="text"
                  value={currentMapping.name}
                  onChange={(e) =>
                    handleUpdateMapping(currentMapping.id, { name: e.target.value })
                  }
                  className="text-xl font-medium border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 w-full"
                />
              </div>

              <div className="space-y-6">
                {templates
                  .find((t) => t.id === selectedTemplate)
                  ?.fields.map((field) => (
                    <div key={field.id} className="border-b pb-4">
                      <h4 className="font-medium mb-2">{field.name}</h4>

                      {/* Column Mapping */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Map to CSV Column
                          </label>
                          <select
                            value={currentMapping.mapping[field.id] || ''}
                            onChange={(e) =>
                              handleFieldMap(field.id, e.target.value)
                            }
                            className="w-full border rounded-md p-2"
                          >
                            <option value="">Select column</option>
                            {csvColumns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Default Value */}
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Default Value
                          </label>
                          <input
                            type="text"
                            value={currentMapping.default_values[field.id] || ''}
                            onChange={(e) =>
                              handleDefaultValue(field.id, e.target.value)
                            }
                            placeholder="Enter default value"
                            className="w-full border rounded-md p-2"
                          />
                        </div>
                      </div>

                      {/* Transformations */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Transformations
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={
                              currentMapping.transformations[field.id]?.type || ''
                            }
                            onChange={(e) =>
                              handleTransformation(
                                field.id,
                                e.target.value,
                                currentMapping.transformations[field.id]?.value
                              )
                            }
                            className="w-full border rounded-md p-2"
                          >
                            <option value="">Select transformation</option>
                            {TRANSFORMATION_OPTIONS.map((option) => (
                              <option key={option.type} value={option.type}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {currentMapping.transformations[field.id]?.type &&
                            TRANSFORMATION_OPTIONS.find(
                              (opt) =>
                                opt.type ===
                                currentMapping.transformations[field.id]?.type
                            )?.hasValue && (
                              <input
                                type="text"
                                value={
                                  currentMapping.transformations[field.id]?.value ||
                                  ''
                                }
                                onChange={(e) =>
                                  handleTransformation(
                                    field.id,
                                    currentMapping.transformations[field.id]?.type ||
                                      '',
                                    e.target.value
                                  )
                                }
                                placeholder="Enter transformation value"
                                className="w-full border rounded-md p-2"
                              />
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
