import React, { useState } from 'react';

interface ShapeElementProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
  onUpdate: (id: string, updates: { content?: string; position?: { x: number; y: number }; style?: Record<string, string> }) => void;
  onDelete: (id: string) => void;
}

const shapeTypes = [
  { name: 'Rectangle', path: 'M 0 0 H 100 V 50 H 0 Z' },
  { name: 'Circle', path: 'M 50 0 A 25 25 0 1 0 50 50 A 25 25 0 1 0 50 0' },
  { name: 'Line', path: 'M 0 25 H 100' },
];

export function ShapeElement({ id, content, position, style = {}, onUpdate, onDelete }: ShapeElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedShape, setSelectedShape] = useState(content || shapeTypes[0].path);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    onUpdate(id, {
      position: { x: newX, y: newY },
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleShapeChange = (shapePath: string) => {
    setSelectedShape(shapePath);
    onUpdate(id, { content: shapePath });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '8px',
        border: '1px solid transparent',
        borderRadius: '4px',
        ...style,
      }}
      className="group hover:border-gray-300"
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="flex flex-col items-center">
        <svg width="100" height="50" viewBox="0 0 100 50" className="mb-2">
          <path
            d={selectedShape}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        
        <select
          value={selectedShape}
          onChange={(e) => handleShapeChange(e.target.value)}
          className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {shapeTypes.map((shape) => (
            <option key={shape.name} value={shape.path}>
              {shape.name}
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={() => onDelete(id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
