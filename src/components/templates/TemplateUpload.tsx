import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface TemplateUploadProps {
  onUploadSuccess?: (templateId: string) => void;
  onUploadError?: (error: string) => void;
}

export function TemplateUpload({ onUploadSuccess, onUploadError }: TemplateUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleTemplateUpload = async (files: File[]) => {
    if (!user || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const templateName = file.name.split('.')[0];
      
      console.log('Creating template record...');
      // 1. Create template record first
      const { data: template, error: dbError } = await supabase
        .from('templates')
        .insert([
          {
            name: templateName,
            description: `Uploaded template: ${file.name}`,
            user_id: user.id,
            metadata: {
              originalName: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            },
            design_data: {
              elements: [],
              settings: {
                width: 800,
                height: 600,
                orientation: 'landscape',
                format: fileExt
              }
            }
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Template record created:', template);

      // 2. Upload the template file to storage
      const storagePath = `template_${template.id}.${fileExt}`;
      console.log('Uploading to storage path:', storagePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        // If upload fails, delete the template record
        const { error: deleteError } = await supabase
          .from('templates')
          .delete()
          .eq('id', template.id);
        
        if (deleteError) {
          console.error('Error cleaning up template record:', deleteError);
        }
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // 3. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(storagePath);

      console.log('Public URL generated:', publicUrl);

      // 4. Update template record with storage info
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          storage_path: storagePath,
          public_url: publicUrl
        })
        .eq('id', template.id);

      if (updateError) {
        console.error('Error updating template with storage info:', updateError);
        throw updateError;
      }

      console.log('Template updated with storage info');
      
      // 5. Call success callback with the template ID
      onUploadSuccess?.(template.id);
    } catch (error) {
      console.error('Error uploading template:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Failed to upload template';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleTemplateUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {uploading
          ? 'Uploading...'
          : isDragActive
          ? 'Drop the template here'
          : 'Drag and drop a template, or click to select'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Supports PDF, DOCX, and PPTX files
      </p>
    </div>
  );
}
