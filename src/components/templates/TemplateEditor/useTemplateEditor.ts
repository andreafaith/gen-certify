import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { TemplateFormData } from './types';

export function useTemplateEditor() {
  const { mutateAsync: saveTemplate, isLoading } = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('templates').insert({
        name: data.name,
        description: data.description,
        design_data: { elements: data.elements },
        is_public: data.isPublic,
        user_id: user.id,
      });

      if (error) throw error;
    },
  });

  return {
    saveTemplate,
    isLoading,
  };
}