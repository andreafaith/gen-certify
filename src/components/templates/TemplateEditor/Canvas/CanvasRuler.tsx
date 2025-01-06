import React from 'react';

interface CanvasRulerProps {
  zoom: number;
  width: number;
  height: number;
}

export function CanvasRuler({ zoom, width, height }: CanvasRulerProps) {
  const rulerSize = 20;
  const step = 50; // Pixels between major marks
  const minorStep = 10; // Pixels between minor marks

  const drawRulerMarks = (context: CanvasRenderingContext2D, length: number, isHorizontal: boolean) => {
    context.beginPath();
    context.strokeStyle = '#666';
    context.fillStyle = '#666';
    context.font = '10px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    for (let i = 0; i <= length; i += step) {
      const position = i * zoom;
      if (isHorizontal) {
        // Major marks
        context.moveTo(position, rulerSize);
        context.lineTo(position, 0);
        context.fillText(i.toString(), position, 2);

        // Minor marks
        if (i + minorStep < length) {
          context.moveTo(position + minorStep * zoom, rulerSize);
          context.lineTo(position + minorStep * zoom, rulerSize / 2);
        }
      } else {
        // Major marks
        context.moveTo(rulerSize, position);
        context.lineTo(0, position);
        context.save();
        context.translate(2, position);
        context.rotate(-Math.PI / 2);
        context.fillText(i.toString(), 0, 0);
        context.restore();

        // Minor marks
        if (i + minorStep < length) {
          context.moveTo(rulerSize, position + minorStep * zoom);
          context.lineTo(rulerSize / 2, position + minorStep * zoom);
        }
      }
    }
    context.stroke();
  };

  React.useEffect(() => {
    // Horizontal ruler
    const hCanvas = document.getElementById('horizontal-ruler') as HTMLCanvasElement;
    if (hCanvas) {
      const ctx = hCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, rulerSize);
        drawRulerMarks(ctx, width / zoom, true);
      }
    }

    // Vertical ruler
    const vCanvas = document.getElementById('vertical-ruler') as HTMLCanvasElement;
    if (vCanvas) {
      const ctx = vCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, rulerSize, height);
        drawRulerMarks(ctx, height / zoom, false);
      }
    }
  }, [zoom, width, height]);

  return (
    <>
      {/* Horizontal Ruler */}
      <canvas
        id="horizontal-ruler"
        width={width}
        height={rulerSize}
        className="absolute top-0 left-0 bg-gray-50"
        style={{ marginLeft: rulerSize }}
      />

      {/* Vertical Ruler */}
      <canvas
        id="vertical-ruler"
        width={rulerSize}
        height={height}
        className="absolute top-0 left-0 bg-gray-50"
        style={{ marginTop: rulerSize }}
      />

      {/* Corner Square */}
      <div
        className="absolute top-0 left-0 bg-gray-50"
        style={{ width: rulerSize, height: rulerSize }}
      />
    </>
  );
}
