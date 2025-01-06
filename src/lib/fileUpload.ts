import { supabase } from './supabase/supabase-client';

export interface FileUploadConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
  compressionQuality?: number;
}

const DEFAULT_CONFIG: FileUploadConfig = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxWidth: 2000,
  maxHeight: 2000,
  compressionQuality: 0.8
};

export async function validateAndOptimizeImage(
  file: File,
  config: Partial<FileUploadConfig> = {}
): Promise<{ valid: boolean; error?: string; optimizedFile?: File }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check file size
  if (file.size > finalConfig.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${finalConfig.maxSizeBytes / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!finalConfig.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${finalConfig.allowedTypes.join(', ')}`
    };
  }

  try {
    // Create an image object to check dimensions
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    URL.revokeObjectURL(imageUrl);

    // Check dimensions
    if (finalConfig.maxWidth && img.width > finalConfig.maxWidth) {
      return {
        valid: false,
        error: `Image width (${img.width}px) exceeds maximum allowed width (${finalConfig.maxWidth}px)`
      };
    }

    if (finalConfig.maxHeight && img.height > finalConfig.maxHeight) {
      return {
        valid: false,
        error: `Image height (${img.height}px) exceeds maximum allowed height (${finalConfig.maxHeight}px)`
      };
    }

    // Optimize image if needed
    if (finalConfig.compressionQuality && finalConfig.compressionQuality < 1) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          file.type,
          finalConfig.compressionQuality
        );
      });

      return {
        valid: true,
        optimizedFile: new File([blob], file.name, { type: file.type })
      };
    }

    return {
      valid: true,
      optimizedFile: file
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to process image'
    };
  }
}

export async function uploadFile(
  file: File,
  path: string,
  userId: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(`${userId}/${path}`, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(`${userId}/${path}`);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}
