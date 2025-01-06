export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  position: {
    x: number;
    y: number;
  };
  style?: {
    width?: string;
    height?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    transform?: string;
    [key: string]: string | undefined;
  };
}

export interface TemplateFormData {
  name: string;
  description: string;
  elements: TemplateElement[];
  isPublic: boolean;
}

export interface CanvasState {
  zoom: number;
  selectedElements: string[];
  guides: {
    x: number[];
    y: number[];
  };
  showGrid: boolean;
  showGuides: boolean;
  gridSize: number;
}