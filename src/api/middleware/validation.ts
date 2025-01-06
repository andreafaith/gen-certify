import { z } from 'zod';

const templateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  variables: z.array(z.string()),
  settings: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    orientation: z.enum(['portrait', 'landscape']),
    margin: z.number().min(0),
  }),
});

const certificateGenerateSchema = z.object({
  templateId: z.string().uuid(),
  data: z.record(z.any()),
  outputFormat: z.enum(['pdf', 'png', 'jpg']),
  settings: z
    .object({
      quality: z.number().min(1).max(100).optional(),
      dpi: z.number().positive().optional(),
      compression: z.boolean().optional(),
    })
    .optional(),
});

const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'suspended', 'pending', 'deactivated']).optional(),
  metadata: z.record(z.any()).optional(),
});

const emailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  variables: z.array(z.string()),
});

const systemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  description: z.string().min(1),
  category: z.enum(['general', 'email', 'api', 'security', 'storage']),
});

const schemas = {
  templateCreate: templateCreateSchema,
  certificateGenerate: certificateGenerateSchema,
  userUpdate: userUpdateSchema,
  emailTemplate: emailTemplateSchema,
  systemSetting: systemSettingSchema,
};

export async function validateRequest(
  data: any,
  schema: keyof typeof schemas
): Promise<void> {
  try {
    await schemas[schema].parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
