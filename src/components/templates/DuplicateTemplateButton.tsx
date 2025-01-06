import React from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Copy } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface DuplicateTemplateButtonProps {
  templateId: string;
  className?: string;
}

export function DuplicateTemplateButton({ templateId, className }: DuplicateTemplateButtonProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // First try using the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('duplicate_template', {
          template_id: templateId
        });

      if (!rpcError) {
        await queryClient.invalidateQueries(['templates']);
        toast({
          title: 'Template Duplicated',
          description: 'The template has been successfully duplicated.',
        });
        return;
      }

      console.error('RPC Error:', rpcError);

      // If RPC fails, fall back to direct database operations
      console.log('Falling back to direct duplication...');
      
      // Get the original template
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) {
        console.error('Fetch Error:', fetchError);
        throw fetchError;
      }

      if (!template) {
        throw new Error('Template not found');
      }

      // Create a new template as a copy
      const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert({
          ...template,
          id: undefined, // Let Supabase generate a new ID
          name: `${template.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw insertError;
      }

      // Invalidate templates query to refresh the list
      await queryClient.invalidateQueries(['templates']);

      toast({
        title: 'Template Duplicated',
        description: 'The template has been successfully duplicated.',
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to duplicate template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleDuplicate}
      title="Duplicate Template"
    >
      <Copy className="h-5 w-5" />
    </Button>
  );
}
