import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTemplateEditor } from './useTemplateEditor';
import { TemplateForm } from './TemplateForm';
import { TemplatePreview } from './TemplatePreview';
import { Canvas } from './Canvas';
import { Button } from '../../ui/Button';
import { TemplateFormData, TemplateElement, CanvasState } from './types';

export function TemplateEditor() {
  const navigate = useNavigate();
  const { saveTemplate, isLoading } = useTemplateEditor();
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    elements: [],
    isPublic: false,
  });

  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    selectedElements: [],
    guides: { x: [], y: [] },
    showGrid: true,
    showGuides: true,
    gridSize: 20,
  });

  const handleSubmit = async (data: TemplateFormData) => {
    await saveTemplate(data);
    navigate('/dashboard/templates');
  };

  const handleAddElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: uuidv4(),
      type,
      content: type === 'text' ? 'New Text' : '',
      position: { x: 100, y: 100 },
      style: {
        width: '200px',
        height: type === 'text' ? 'auto' : '200px',
        ...(type === 'text' && {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#000000',
        }),
      },
    };

    setFormData(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
  };

  const handleElementsChange = (elements: TemplateElement[]) => {
    setFormData(prev => ({ ...prev, elements }));
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setCanvasState(prev => ({ ...prev, selectedElements: selectedIds }));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Template Editor</h1>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate('/dashboard/templates')}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(formData)}
            disabled={isLoading}
          >
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Template Properties */}
        <div className="space-y-6">
          <TemplateForm
            data={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {/* Element Tools */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Add Elements</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddElement('text')}
              >
                Add Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddElement('image')}
              >
                Add Image
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddElement('shape')}
              >
                Add Shape
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-lg p-4">
            <Canvas
              elements={formData.elements}
              onElementsChange={handleElementsChange}
              selectedElements={canvasState.selectedElements}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}