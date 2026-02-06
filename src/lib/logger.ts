/**
 * Server-Side Logger Configuration
 * 
 * WARNING: This module should ONLY be used in Server-Side code:
 * - Server Actions
 * - API Routes (app/api/*)
 * - Server Components (if logging is needed)
 * 
 * DO NOT import this in Client Components!
 */

import pino from 'pino';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname', // Cleaner local logs
        }
    } : undefined,
    base: {
        env: process.env.NODE_ENV,
    },
    serializers: {
        error: pino.stdSerializers.err,
    },
});
