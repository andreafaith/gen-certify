import type { TemplateFormData } from './types';

interface TemplatePreviewProps {
  data: TemplateFormData;
}

export function TemplatePreview({ data }: TemplatePreviewProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="aspect-[8.5/11] bg-white rounded shadow-sm p-8">
        <h3 className="text-lg font-medium mb-2">{data.name || 'Untitled Template'}</h3>
        {data.description && (
          <p className="text-sm text-gray-500">{data.description}</p>
        )}
        {/* Render template elements here */}
      </div>
    </div>
  );
}