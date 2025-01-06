import React, { useRef, useState, useEffect } from 'react';
import Moveable from 'react-moveable';
import Selecto from 'react-selecto';
import { TemplateElement } from '../types';
import { CanvasRuler } from './CanvasRuler';
import { CanvasGrid } from './CanvasGrid';
import { CanvasGuides } from './CanvasGuides';

interface CanvasProps {
  elements: TemplateElement[];
  onElementsChange: (elements: TemplateElement[]) => void;
  selectedElements: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function Canvas({
  elements,
  onElementsChange,
  selectedElements,
  onSelectionChange,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<typeof Moveable>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  // Grid settings
  const gridSize = 20;
  const snapThreshold = 5;

  // Update element positions when dragging
  const handleDrag = (e: any) => {
    const target = e.target;
    const elementId = target.getAttribute('data-element-id');
    const updatedElements = elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          position: {
            x: e.beforeTranslate[0],
            y: e.beforeTranslate[1],
          },
        };
      }
      return el;
    });
    onElementsChange(updatedElements);
  };

  // Snap to grid
  const handleDragEnd = (e: any) => {
    const target = e.target;
    const elementId = target.getAttribute('data-element-id');
    const { x, y } = e.beforeTranslate;

    // Snap to nearest grid point
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    const updatedElements = elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          position: {
            x: snappedX,
            y: snappedY,
          },
        };
      }
      return el;
    });
    onElementsChange(updatedElements);
  };

  // Handle element resizing
  const handleResize = (e: any) => {
    const target = e.target;
    const elementId = target.getAttribute('data-element-id');
    const updatedElements = elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          style: {
            ...el.style,
            width: `${e.width}px`,
            height: `${e.height}px`,
          },
        };
      }
      return el;
    });
    onElementsChange(updatedElements);
  };

  // Handle element rotation
  const handleRotate = (e: any) => {
    const target = e.target;
    const elementId = target.getAttribute('data-element-id');
    const updatedElements = elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          style: {
            ...el.style,
            transform: `rotate(${e.rotate}deg)`,
          },
        };
      }
      return el;
    });
    onElementsChange(updatedElements);
  };

  // Update selection when clicking on elements
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const elementId = target.getAttribute('data-element-id');
    if (elementId) {
      if (e.shiftKey) {
        onSelectionChange(
          selectedElements.includes(elementId)
            ? selectedElements.filter(id => id !== elementId)
            : [...selectedElements, elementId]
        );
      } else {
        onSelectionChange([elementId]);
      }
    } else {
      onSelectionChange([]);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="relative bg-white rounded-lg shadow-lg">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 z-10">
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1 hover:bg-gray-100 rounded text-sm"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded ${
              showGrid ? 'bg-indigo-100 text-indigo-600' : 'bg-white'
            }`}
            title="Toggle Grid"
          >
            Grid
          </button>
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-2 rounded ${
              showGuides ? 'bg-indigo-100 text-indigo-600' : 'bg-white'
            }`}
            title="Toggle Guides"
          >
            Guides
          </button>
        </div>
      </div>

      {/* Rulers */}
      <CanvasRuler
        zoom={zoom}
        width={containerRef.current?.clientWidth || 0}
        height={containerRef.current?.clientHeight || 0}
      />

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[8.5/11] overflow-hidden"
        onClick={handleClick}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Grid */}
        {showGrid && <CanvasGrid size={gridSize} />}

        {/* Guides */}
        {showGuides && <CanvasGuides guides={guides} />}

        {/* Elements */}
        {elements.map(element => (
          <div
            key={element.id}
            data-element-id={element.id}
            className="absolute"
            style={{
              left: element.position.x,
              top: element.position.y,
              ...element.style,
            }}
          >
            {element.content}
          </div>
        ))}

        {/* Moveable Controller */}
        <Moveable
          ref={moveableRef}
          target={selectedElements.map(id => `[data-element-id="${id}"]`)}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          snapGridWidth={gridSize}
          snapGridHeight={gridSize}
          elementSnapDirections={{ top: true, left: true, bottom: true, right: true }}
          elementGuidelines={elements
            .filter(el => !selectedElements.includes(el.id))
            .map(el => `[data-element-id="${el.id}"]`)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onResize={handleResize}
          onRotate={handleRotate}
        />

        {/* Selection Tool */}
        <Selecto
          dragContainer={containerRef.current}
          selectableTargets={['[data-element-id]']}
          hitRate={0}
          selectByClick={true}
          selectFromInside={false}
          toggleContinueSelect={['shift']}
          onSelect={e => {
            onSelectionChange(
              e.selected.map(el => el.getAttribute('data-element-id')!)
            );
          }}
        />
      </div>
    </div>
  );
}
