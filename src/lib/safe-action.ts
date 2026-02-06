/**
 * Server Action Wrapper with "Wide Event" Logging Pattern
 * 
 * This wrapper provides:
 * - Automatic duration tracking
 * - Request headers extraction (User-Agent, IP) for tracing
 * - Single log line per action (Wide Event pattern)
 * - Error stack trace capture
 */

import { headers } from 'next/headers';
import { logger } from './logger';

type ActionContext = {
    event: string;
    actionName: string;
    status: 'pending' | 'success' | 'error';
    userAgent?: string;
    clientIp?: string;
    userId?: string;
    [key: string]: unknown;
};

/**
 * Extracts tracing headers from the current request
 */
async function getTracingHeaders(): Promise<{ userAgent?: string; clientIp?: string }> {
    try {
        const headersList = await headers();

        // Get User-Agent
        const userAgent = headersList.get('user-agent') || undefined;

        // Get Client IP (check various headers for proxied requests)
        const clientIp =
            headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            headersList.get('cf-connecting-ip') || // Cloudflare
            undefined;

        return { userAgent, clientIp };
    } catch {
        // headers() might fail if called outside of request context
        return {};
    }
}

/**
 * Sanitizes input data by removing sensitive fields
 */
function sanitizeInputs(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    const sanitized = { ...data as Record<string, unknown> };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Higher-Order Function to wrap Server Actions with "Wide Event" logging.
 * It catches errors, measures duration, and logs a single JSON object.
 * 
 * @example
 * const deleteUserLogic = async (userId: string) => {
 *   const supabase = createClient();
 *   const { error } = await supabase.from('users').delete().eq('id', userId);
 *   if (error) throw new Error(error.message);
 *   return { success: true };
 * };
 * 
 * export const deleteUser = withLogging('deleteUser', deleteUserLogic);
 */
export function withLogging<T, R>(
    actionName: string,
    fn: (data: T) => Promise<R>
) {
    return async (data: T): Promise<R> => {
        const start = Date.now();

        // Get tracing headers
        const tracingHeaders = await getTracingHeaders();

        // Initialize Context (The "Wide Event" bucket)
        const context: ActionContext = {
            event: 'server_action',
            actionName,
            status: 'pending',
            inputs: sanitizeInputs(data),
            ...tracingHeaders,
        };

        try {
            // Execute the actual function
            const result = await fn(data);

            // Log Success (Single line)
            logger.info({
                ...context,
                status: 'success',
                duration_ms: Date.now() - start,
            }, `Action ${actionName} completed`);

            return result;

        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));

            // Log Error (Single line with full context)
            logger.error({
                ...context,
                status: 'error',
                error: err.message,
                stack: err.stack,
                duration_ms: Date.now() - start,
            }, `Action ${actionName} failed`);

            throw error; // Re-throw so the UI knows it failed
        }
    };
}
