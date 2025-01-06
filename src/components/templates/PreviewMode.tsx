import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../ui/Button';

interface Element {
  id: string;
  type: 'text' | 'image' | 'shape' | 'placeholder';
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
}

interface TemplateProperties {
  size: {
    width: number;
    height: number;
    unit: 'mm' | 'in' | 'px';
  };
  orientation: 'portrait' | 'landscape';
  background: {
    type: 'color' | 'image';
    value: string;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'mm' | 'in' | 'px';
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'mm' | 'in' | 'px';
  };
}

interface PreviewModeProps {
  elements: Element[];
  properties: TemplateProperties;
  onClose: () => void;
}

const sampleData = {
  recipient: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    position: 'Senior Developer',
  },
  course: {
    name: 'Advanced Web Development',
    completion_date: '2024-01-01',
    grade: 'A',
  },
  issuer: {
    name: 'Tech Academy',
    signature: 'Jane Smith',
    title: 'Program Director',
  }
};

export function PreviewMode({ elements, properties, onClose }: PreviewModeProps) {
  const [previewData, setPreviewData] = useState(sampleData);
  
  // Memoize the variable replacement function
  const replaceVariables = useCallback((content: string) => {
    return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = previewData;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || match;
    });
  }, [previewData]);

  // Memoize elements with replaced variables
  const processedElements = useMemo(() => 
    elements.map(element => ({
      ...element,
      content: replaceVariables(element.content)
    })), [elements, replaceVariables]);

  // Handle data updates
  const handleDataChange = (section: string, field: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Preview Mode</h2>
          <Button onClick={onClose} variant="secondary">Close Preview</Button>
        </div>
        
        <div className="p-6 grid grid-cols-3 gap-6">
          {/* Preview Canvas */}
          <div className="col-span-2 overflow-auto">
            <div
              className="bg-white shadow-lg mx-auto"
              style={{
                width: `${properties.size.width}${properties.size.unit}`,
                height: `${properties.size.height}${properties.size.unit}`,
                background: properties.background.type === 'color' 
                  ? properties.background.value 
                  : `url(${properties.background.value})`,
                backgroundSize: 'cover',
                position: 'relative',
                transform: properties.orientation === 'landscape' ? 'rotate(90deg)' : 'none',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  margin: `${properties.margins.top}${properties.margins.unit} ${properties.margins.right}${properties.margins.unit} ${properties.margins.bottom}${properties.margins.unit} ${properties.margins.left}${properties.margins.unit}`,
                  padding: `${properties.padding.top}${properties.padding.unit} ${properties.padding.right}${properties.padding.unit} ${properties.padding.bottom}${properties.padding.unit} ${properties.padding.left}${properties.padding.unit}`,
                }}
              >
                {processedElements.map(element => (
                  <div
                    key={element.id}
                    style={{
                      position: 'absolute',
                      left: `${element.position.x}%`,
                      top: `${element.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      ...element.style,
                    }}
                  >
                    {element.type === 'image' ? (
                      <img src={element.content} alt="" className="max-w-full h-auto" />
                    ) : (
                      <div>{element.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Data Editor Panel */}
          <div className="space-y-6 overflow-y-auto">
            <div>
              <h3 className="font-medium mb-3">Recipient Information</h3>
              <div className="space-y-2">
                {Object.entries(previewData.recipient).map(([field, value]) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-600 capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleDataChange('recipient', field, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Course Information</h3>
              <div className="space-y-2">
                {Object.entries(previewData.course).map(([field, value]) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-600 capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleDataChange('course', field, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Issuer Information</h3>
              <div className="space-y-2">
                {Object.entries(previewData.issuer).map(([field, value]) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm text-gray-600 capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleDataChange('issuer', field, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PreviewCanvas = React.memo(({ elements, properties }: { 
  elements: Element[], 
  properties: TemplateProperties 
}) => {
  const canvasStyle = {
    width: `${properties.size.width}${properties.size.unit}`,
    height: `${properties.size.height}${properties.size.unit}`,
    background: properties.background.type === 'color' 
      ? properties.background.value 
      : `url(${properties.background.value})`,
    backgroundSize: 'cover',
    position: 'relative' as const,
    margin: `${properties.margins.top}${properties.margins.unit} ${properties.margins.right}${properties.margins.unit} ${properties.margins.bottom}${properties.margins.unit} ${properties.margins.left}${properties.margins.unit}`,
    padding: `${properties.padding.top}${properties.padding.unit} ${properties.padding.right}${properties.padding.unit} ${properties.padding.bottom}${properties.padding.unit} ${properties.padding.left}${properties.padding.unit}`,
  };

  return (
    <div style={canvasStyle} className="shadow-lg">
      {elements.map(element => (
        <PreviewElement key={element.id} element={element} />
      ))}
    </div>
  );
});

const PreviewElement = React.memo(({ element }: { element: Element }) => {
  const style = {
    position: 'absolute' as const,
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    transform: 'translate(-50%, -50%)',
    ...element.style,
  };

  return (
    <div style={style}>
      {element.type === 'image' ? (
        <img src={element.content} alt="" className="max-w-full h-auto" />
      ) : (
        <div>{element.content}</div>
      )}
    </div>
  );
});
