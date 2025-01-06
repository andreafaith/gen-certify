import DOMPurify from 'dompurify';
import { z } from 'zod';

// Basic sanitization for text input
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [] // No attributes allowed
  });
}

// Sanitize HTML content (for rich text editors)
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 'h1', 'h2', 'h3',
      'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_')          // Replace multiple underscores with single
    .toLowerCase();
}

// Schema for certificate data
export const certificateDataSchema = z.object({
  title: z.string().min(1).max(200),
  recipient: z.string().min(1).max(200),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  description: z.string().max(1000).optional(),
  customFields: z.record(z.string()).optional()
});

// Schema for user profile data
export const userProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  organization: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  preferences: z.record(z.unknown()).optional()
});

// Validate and sanitize certificate data
export function validateCertificateData(data: unknown) {
  const result = certificateDataSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid certificate data: ${result.error.message}`);
  }

  return {
    ...result.data,
    title: sanitizeText(result.data.title),
    recipient: sanitizeText(result.data.recipient),
    description: result.data.description ? sanitizeHtml(result.data.description) : undefined,
    customFields: result.data.customFields ? 
      Object.fromEntries(
        Object.entries(result.data.customFields).map(([k, v]) => [
          sanitizeText(k),
          sanitizeText(v)
        ])
      ) : undefined
  };
}

// Validate and sanitize user profile data
export function validateUserProfile(data: unknown) {
  const result = userProfileSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid profile data: ${result.error.message}`);
  }

  return {
    ...result.data,
    name: sanitizeText(result.data.name),
    organization: result.data.organization ? 
      sanitizeText(result.data.organization) : undefined,
    phone: result.data.phone ? 
      sanitizeText(result.data.phone) : undefined
  };
}

// SQL injection prevention for dynamic queries
export function escapeSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

// XSS prevention for dynamic HTML
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
