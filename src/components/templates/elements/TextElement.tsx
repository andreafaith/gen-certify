import React, { useState, useRef, useEffect } from 'react';

interface TextElementProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
  onUpdate: (id: string, updates: { content?: string; position?: { x: number; y: number }; style?: Record<string, string> }) => void;
  onDelete: (id: string) => void;
}

export function TextElement({ id, content, position, style = {}, onUpdate, onDelete }: TextElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState(position);
  const elementRef = useRef<HTMLDivElement>(null);
  const [elementSize, setElementSize] = useState({ width: 200, height: 100 });

  useEffect(() => {
    setElementPosition(position);
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === elementRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - elementPosition.x,
        y: e.clientY - elementPosition.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setElementPosition({ x: newX, y: newY });
      onUpdate(id, { position: { x: newX, y: newY } });
    } else if (isResizing && elementRef.current) {
      e.preventDefault();
      const rect = elementRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const newHeight = e.clientY - rect.top;
      setElementSize({ width: newWidth, height: newHeight });
      onUpdate(id, { 
        style: { 
          ...style,
          width: `${newWidth}px`,
          height: `${newHeight}px`
        } 
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    if (isResizing) {
      setIsResizing(false);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart.x, dragStart.y]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: `${elementPosition.x}px`,
        top: `${elementPosition.y}px`,
        width: `${elementSize.width}px`,
        minHeight: `${elementSize.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '8px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        userSelect: 'none',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        if (e.target === elementRef.current) {
          setIsEditing(true);
        }
      }}
      className="group"
    >
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onUpdate(id, { content: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              setIsEditing(false);
            }
          }}
          className="w-full h-full border-none bg-transparent focus:outline-none focus:ring-0 resize-none"
          autoFocus
          style={{ minHeight: '1em' }}
        />
      ) : (
        <>
          <div className="absolute -top-8 right-0 hidden group-hover:flex gap-2 bg-white rounded-md shadow-sm p-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="whitespace-pre-wrap">{content || 'Double-click to edit'}</div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100"
            onMouseDown={handleResizeStart}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #718096 50%)',
            }}
          />
        </>
      )}
    </div>
  );
}
