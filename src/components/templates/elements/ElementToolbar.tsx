import React from 'react';
import { Button } from '../../ui/Button';
import {
  DocumentTextIcon,
  PhotoIcon,
  Square2StackIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

interface ElementToolbarProps {
  onAddElement: (type: 'text' | 'image' | 'shape' | 'placeholder') => void;
}

export function ElementToolbar({ onAddElement }: ElementToolbarProps) {
  return (
    <div className="flex gap-2 p-2 bg-white border rounded-lg shadow-sm">
      <Button
        variant="secondary"
        onClick={() => onAddElement('text')}
        className="flex items-center gap-2"
      >
        <DocumentTextIcon className="h-5 w-5" />
        <span>Text</span>
      </Button>

      <Button
        variant="secondary"
        onClick={() => onAddElement('image')}
        className="flex items-center gap-2"
      >
        <PhotoIcon className="h-5 w-5" />
        <span>Image</span>
      </Button>

      <Button
        variant="secondary"
        onClick={() => onAddElement('shape')}
        className="flex items-center gap-2"
      >
        <Square2StackIcon className="h-5 w-5" />
        <span>Shape</span>
      </Button>

      <Button
        variant="secondary"
        onClick={() => onAddElement('placeholder')}
        className="flex items-center gap-2"
      >
        <HashtagIcon className="h-5 w-5" />
        <span>Dynamic Field</span>
      </Button>
    </div>
  );
}
