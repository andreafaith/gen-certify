import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

interface PlaceholderElementProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  style?: React.CSSProperties;
  onUpdate: (id: string, updates: Partial<{ content: string; position: { x: number; y: number }; style: React.CSSProperties }>) => void;
  onDelete: (id: string) => void;
}

export function PlaceholderElement({
  id,
  content,
  position,
  style = {},
  onUpdate,
  onDelete,
}: PlaceholderElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState(position);
  const [isSelectingField, setIsSelectingField] = useState(!content);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content.replace(/[{}]/g, ''));
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cache the query with a longer stale time
  const { data: fieldTemplates, isLoading } = useQuery({
    queryKey: ['fieldTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_templates')
        .select('*')
        .order('category')
        .order('display_name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Memoize categories to prevent recalculation
  const categories = useMemo(() => 
    fieldTemplates
      ? Array.from(new Set(fieldTemplates.map(field => field.category)))
      : []
  , [fieldTemplates]);

  useEffect(() => {
    setElementPosition(position);
  }, [position]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content.replace(/[{}]/g, ''));
  }, [content]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - elementPosition.x,
      y: e.clientY - elementPosition.y,
    });
  }, [isEditing, elementPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setElementPosition(newPosition);
      onUpdate(id, { position: newPosition });
    }
  }, [isDragging, dragStart, id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^a-zA-Z0-9_.]/g, '');
    setLocalContent(newValue);
  }, []);

  const handleContentBlur = useCallback(() => {
    onUpdate(id, { content: `{{${localContent}}}` });
    setIsEditing(false);
  }, [id, localContent, onUpdate]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `template-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      onUpdate(id, { content: publicUrl });
      setIsSelectingField(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    }
  }, [id, onUpdate]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content.startsWith('http')) {
      setIsEditing(true);
    }
  }, [content]);

  if (isLoading) {
    return <div>Loading fields...</div>;
  }

  return (
    <>
      {isSelectingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Select Dynamic Field or Upload Image</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-6">
              <h3 className="text-lg font-semibold">Or Select Dynamic Field</h3>
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <h3 className="text-lg font-semibold capitalize">{category}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldTemplates
                      ?.filter(field => field.category === category)
                      .map(field => (
                        <button
                          key={field.id}
                          onClick={() => {
                            onUpdate(id, { content: `{{${field.name}}}` });
                            setIsSelectingField(false);
                          }}
                          className="text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="font-medium">{field.display_name}</div>
                          {field.description && (
                            <div className="text-sm text-gray-500">{field.description}</div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => onDelete(id)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={elementRef}
        style={{
          position: 'absolute',
          left: elementPosition.x,
          top: elementPosition.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '8px',
          border: '1px dashed #9CA3AF',
          borderRadius: '4px',
          backgroundColor: '#F3F4F6',
          ...style,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="group"
      >
        {content.startsWith('http') ? (
          <img 
            src={content} 
            alt="Template element" 
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
        ) : isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localContent}
            onChange={handleContentChange}
            onBlur={handleContentBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleContentBlur();
              }
            }}
            className="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ cursor: 'text' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="px-2 py-1 rounded bg-blue-50 text-blue-700 cursor-text"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {content}
          </div>
        )}
        
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex bg-white border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSelectingField(true);
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Change Field/Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
