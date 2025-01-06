import React from 'react';

interface CanvasGuidesProps {
  guides: {
    x: number[];
    y: number[];
  };
}

export function CanvasGuides({ guides }: CanvasGuidesProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Vertical Guides */}
      {guides.x.map((x, index) => (
        <div
          key={`x-${index}`}
          className="absolute top-0 bottom-0 w-px bg-indigo-500"
          style={{ left: x }}
        />
      ))}

      {/* Horizontal Guides */}
      {guides.y.map((y, index) => (
        <div
          key={`y-${index}`}
          className="absolute left-0 right-0 h-px bg-indigo-500"
          style={{ top: y }}
        />
      ))}
    </div>
  );
}
