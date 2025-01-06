import React, { useEffect, useRef } from 'react';

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'dynamic';
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
}

interface Template {
  id: string;
  name: string;
  design_data: {
    elements: TemplateElement[];
    properties: {
      size: {
        width: number;
        height: number;
        unit: string;
      };
      background: {
        type: 'color' | 'image';
        value: string;
      };
    };
  };
}

interface CertificatePreviewProps {
  template: Template;
  data: Record<string, string>;
}

export function CertificatePreview({ template, data }: CertificatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template.design_data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size based on template dimensions
    canvas.width = template.design_data.properties.size.width || 800;
    canvas.height = template.design_data.properties.size.height || 600;

    // Draw background
    if (template.design_data.properties.background) {
      if (template.design_data.properties.background.type === 'color') {
        ctx.fillStyle = template.design_data.properties.background.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawElements();
      } else if (template.design_data.properties.background.type === 'image') {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawElements();
        };
        img.src = template.design_data.properties.background.value;
      }
    } else {
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawElements();
    }

    function drawElements() {
      template.design_data.elements.forEach(element => {
        if (!element.position) return;

        switch (element.type) {
          case 'text':
          case 'dynamic': {
            ctx.font = element.style?.fontSize 
              ? `${element.style.fontWeight || 'normal'} ${element.style.fontSize}px ${element.style.fontFamily || 'Arial'}`
              : '20px Arial';
            ctx.fillStyle = element.style?.color || 'black';
            ctx.textAlign = (element.style?.textAlign as CanvasTextAlign) || 'left';

            let content = element.content;
            // Replace dynamic fields with actual data
            if (element.type === 'dynamic') {
              const fieldName = element.content.replace(/[{}]/g, '');
              content = data[fieldName] || `[${fieldName}]`;
            }
            
            ctx.fillText(
              content,
              element.position.x,
              element.position.y
            );
            break;
          }
          case 'image': {
            if (element.content) {
              const img = new Image();
              img.onload = () => {
                const width = parseInt(element.style?.width as string) || 100;
                const height = parseInt(element.style?.height as string) || 100;
                ctx.drawImage(
                  img,
                  element.position.x,
                  element.position.y,
                  width,
                  height
                );
              };
              img.src = element.content;
            }
            break;
          }
        }
      });
    }
  }, [template, data]);

  return (
    <div className="relative w-full overflow-hidden border rounded-lg">
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxHeight: '70vh' }}
      />
    </div>
  );
}
