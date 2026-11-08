/**
 * HOST SEAM — the ONLY file in this module that imports from the host application.
 */
import { toast } from 'sonner';
import { apiClient } from '@/core/client';

/**
 * Must expose get/post returning the parsed body, and reject with
 * `{ message, statusCode, data?, errors?, retryAfter? }` (see src/core/client.ts → handleError).
 */
export const gsMigrationHttp = apiClient;

export const gsMigrationToast = toast;
