import React from 'react';
import { Input } from '../ui/Input';

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

interface TemplatePropertiesProps {
  properties: TemplateProperties;
  onChange: (properties: TemplateProperties) => void;
}

const PAPER_SIZES = [
  { name: 'Letter', width: 8.5, height: 11, unit: 'in' },
  { name: 'A4', width: 210, height: 297, unit: 'mm' },
  { name: 'A5', width: 148, height: 210, unit: 'mm' },
  { name: 'Custom', width: 0, height: 0, unit: 'mm' },
];

export function TemplateProperties({ properties, onChange }: TemplatePropertiesProps) {
  const handleSizeChange = (size: typeof PAPER_SIZES[0]) => {
    onChange({
      ...properties,
      size: {
        width: size.width,
        height: size.height,
        unit: size.unit as 'mm' | 'in' | 'px',
      },
    });
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    onChange({
      ...properties,
      orientation,
      size: orientation === 'landscape'
        ? {
            ...properties.size,
            width: properties.size.height,
            height: properties.size.width,
          }
        : properties.size,
    });
  };

  const handleBackgroundChange = (type: 'color' | 'image', value: string) => {
    onChange({
      ...properties,
      background: { type, value },
    });
  };

  const handleSpacingChange = (
    type: 'margins' | 'padding',
    side: 'top' | 'right' | 'bottom' | 'left',
    value: number
  ) => {
    onChange({
      ...properties,
      [type]: {
        ...properties[type],
        [side]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Size Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Page Size</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={`${properties.size.width}x${properties.size.height}${properties.size.unit}`}
            onChange={(e) => {
              const size = PAPER_SIZES.find(
                (s) => `${s.width}x${s.height}${s.unit}` === e.target.value
              );
              if (size) handleSizeChange(size);
            }}
          >
            {PAPER_SIZES.map((size) => (
              <option key={size.name} value={`${size.width}x${size.height}${size.unit}`}>
                {size.name} ({size.width}x{size.height} {size.unit})
              </option>
            ))}
          </select>

          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={properties.orientation}
            onChange={(e) => handleOrientationChange(e.target.value as 'portrait' | 'landscape')}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      {/* Background Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Background</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={properties.background.type}
            onChange={(e) => handleBackgroundChange(e.target.value as 'color' | 'image', '')}
          >
            <option value="color">Color</option>
            <option value="image">Image</option>
          </select>

          {properties.background.type === 'color' ? (
            <input
              type="color"
              value={properties.background.value}
              onChange={(e) => handleBackgroundChange('color', e.target.value)}
              className="block w-full p-1 border-gray-300 rounded-md"
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    handleBackgroundChange('image', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          )}
        </div>
      </div>

      {/* Margins */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Margins ({properties.margins.unit})</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Top"
            value={properties.margins.top}
            onChange={(e) => handleSpacingChange('margins', 'top', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Right"
            value={properties.margins.right}
            onChange={(e) => handleSpacingChange('margins', 'right', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Bottom"
            value={properties.margins.bottom}
            onChange={(e) => handleSpacingChange('margins', 'bottom', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Left"
            value={properties.margins.left}
            onChange={(e) => handleSpacingChange('margins', 'left', Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      {/* Padding */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Padding ({properties.padding.unit})</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Top"
            value={properties.padding.top}
            onChange={(e) => handleSpacingChange('padding', 'top', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Right"
            value={properties.padding.right}
            onChange={(e) => handleSpacingChange('padding', 'right', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Bottom"
            value={properties.padding.bottom}
            onChange={(e) => handleSpacingChange('padding', 'bottom', Number(e.target.value))}
            min={0}
          />
          <Input
            type="number"
            label="Left"
            value={properties.padding.left}
            onChange={(e) => handleSpacingChange('padding', 'left', Number(e.target.value))}
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
