import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { validateAndOptimizeImage, uploadFile } from '@/lib/fileUpload';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ImageElementProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
  onUpdate: (id: string, updates: { content?: string; position?: { x: number; y: number }; style?: Record<string, string> }) => void;
  onDelete: (id: string) => void;
}

export function ImageElement({ id, content, position, style = {}, onUpdate, onDelete }: ImageElementProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState(position);
  const [elementSize, setElementSize] = useState({
    width: parseInt(style.width as string) || 200,
    height: parseInt(style.height as string) || 200
  });
  const elementRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setElementPosition(position);
  }, [position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    
    if (e.target === elementRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - elementPosition.x,
        y: e.clientY - elementPosition.y
      });
    }
  }, [elementPosition.x, elementPosition.y, isResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setElementPosition({ x: newX, y: newY });
      onUpdate(id, { position: { x: newX, y: newY } });
    } else if (isResizing && elementRef.current) {
      e.preventDefault();
      const rect = elementRef.current.getBoundingClientRect();
      const newWidth = Math.max(50, e.clientX - rect.left);
      const newHeight = Math.max(50, e.clientY - rect.top);
      
      setElementSize({ width: newWidth, height: newHeight });
      onUpdate(id, {
        style: {
          ...style,
          width: `${newWidth}px`,
          height: `${newHeight}px`
        }
      });
    }
  }, [isDragging, isResizing, dragStart, id, onUpdate, style]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isUploading && !isDragging && !isResizing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    try {
      setIsUploading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Validate and optimize the image
      const { valid, error: validationError, optimizedFile } = await validateAndOptimizeImage(file);
      if (!valid || !optimizedFile) {
        throw new Error(validationError || 'Invalid image file');
      }

      // Upload to Supabase Storage
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { success, error: uploadError, url } = await uploadFile(
        optimizedFile,
        filePath,
        user.id
      );

      if (!success || !url) {
        throw new Error(uploadError || 'Failed to upload image');
      }

      // Update the element with the permanent URL
      onUpdate(id, { 
        content: url,
        style: {
          ...style,
          width: `${elementSize.width}px`,
          height: `${elementSize.height}px`,
          objectFit: 'contain'
        }
      });

      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute cursor-move select-none',
        isDragging && 'z-50',
        isResizing && 'z-50',
        !isDragging && !isResizing && 'z-10'
      )}
      style={{
        transform: `translate(${elementPosition.x}px, ${elementPosition.y}px)`,
        width: `${elementSize.width}px`,
        height: `${elementSize.height}px`
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploading}
      />
      
      {content ? (
        <div className="relative w-full h-full group">
          <img
            src={content}
            alt="Template element"
            className="w-full h-full object-contain"
            style={style}
            draggable={false}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white border border-gray-300 opacity-0 group-hover:opacity-100"
            onMouseDown={handleResizeStart}
          />
        </div>
      ) : (
        <div 
          className={cn(
            'flex items-center justify-center w-full h-full',
            'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg',
            isUploading ? 'opacity-50' : 'hover:bg-gray-200'
          )}
        >
          <span className="text-gray-500">
            {isUploading ? 'Uploading...' : 'Click to add image'}
          </span>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white border border-gray-300 opacity-0 group-hover:opacity-100"
            onMouseDown={handleResizeStart}
          />
        </div>
      )}
    </div>
  );
}
