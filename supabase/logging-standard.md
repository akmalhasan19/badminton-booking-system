# LOGGING STANDARD & GUIDELINES (Wide Events)

## 1. Core Philosophy
We are shifting from "Debugging via Text" to "Debugging via Data".
* **Forbidden:** `console.log`, `console.error` (unless during local dev debugging, must be removed before commit).
* **Required:** Structured JSON logging using **Pino**.
* **Pattern:** "Wide Events" (Canonical Log Lines). Instead of logging 10 times during a request, we accumulate context and log **once** at the end (or upon error) with all necessary data.

## 2. Technical Stack Implementation
* **Library:** `pino` (for JSON structure) + `pino-pretty` (for local dev readability).
* **Context Passing:** Since we use **Next.js App Router** & **Server Actions**, we cannot rely on global middleware state easily. We will use a **Wrapper Pattern** (Higher-Order Function) for Server Actions.

## 3. Implementation Steps for AI Agent

### Step A: Install Dependencies
Run this if not installed:
`npm install pino pino-pretty`

### Step B: Create Logger Configuration
Create file: `src/lib/logger.ts`
```typescript
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
});
Step C: Create Server Action Wrapper (The "Wide Event" Builder)
This is the most critical part. We need a utility to wrap our Server Actions to handle logging automatically.

Create file: src/lib/safe-action.ts

TypeScript
import { logger } from './logger';

type ActionContext = {
  actionName: string;
  userId?: string; // Add authentication context here later if needed
  [key: string]: any;
};

/**
 * Higher-Order Function to wrap Server Actions with "Wide Event" logging.
 * It catches errors, measures duration, and logs a single JSON object.
 */
export function withLogging<T, R>(
  actionName: string,
  fn: (data: T) => Promise<R>
) {
  return async (data: T): Promise<R> => {
    const start = Date.now();
    
    // 1. Initialize Context (The "Wide Event" bucket)
    const context: ActionContext = {
      event: 'server_action',
      actionName,
      status: 'pending',
      inputs: data, // Be careful with sensitive data here (password, etc)!
    };

    try {
      // 2. Execute the actual function
      const result = await fn(data);

      // 3. Log Success (Single line)
      logger.info({
        ...context,
        status: 'success',
        duration_ms: Date.now() - start,
        // Optional: Log specific result metadata if needed, but avoid logging huge return objects
        // resultSummary: ... 
      }, `Action ${actionName} completed`);

      return result;

    } catch (error: any) {
      // 4. Log Error (Single line with full context)
      logger.error({
        ...context,
        status: 'error',
        error: error.message,
        stack: error.stack,
        duration_ms: Date.now() - start,
      }, `Action ${actionName} failed`);

      throw error; // Re-throw so the UI knows it failed
    }
  };
}
4. Usage Rules for AI Agent
When creating or refactoring Server Actions (e.g., in src/app/admin/.../actions.ts), follow this pattern:

BEFORE (Bad):

TypeScript
export async function deleteUser(userId: string) {
  console.log("Deleting user", userId);
  try {
    await supabase.from('users').delete().eq('id', userId);
    console.log("Deleted");
  } catch (e) {
    console.error(e);
  }
}
AFTER (Good - Wrapped):

TypeScript
import { withLogging } from '@/lib/safe-action';
import { createClient } from '@/utils/supabase/server'; // adjust import based on project

// Define the raw logic
const deleteUserLogic = async (userId: string) => {
  const supabase = createClient();
  
  // Perform DB operation
  const { error } = await supabase.from('users').delete().eq('id', userId);
  
  if (error) throw new Error(error.message);
  
  return { success: true };
};

// Export the wrapped version
export const deleteUser = withLogging('deleteUser', deleteUserLogic);
5. Logging Supabase Queries
When writing complex Supabase queries inside the logic:

Do not log every single row returned.

Do log the metadata of the result if it helps debugging (e.g., rows_affected, count).

If a specific business logic requires detailed tracing inside the function (before the final log), add it to a temporary context object and return it, or use logger.debug() sparingly.

6. Sensitive Data Rule
Never log passwords, tokens, or PII (Personally Identifiable Information) directly in the inputs field.

If the input data contains sensitive fields, filter them out before passing to withLogging or modify the wrapper to sanitize inputs.


***

### Cara Menggunakan File Ini:
1.  Buat file baru di root folder projectmu dengan nama `LOGGING_STANDARD.md`.
2.  Copy-paste isi markdown di atas ke dalamnya.
3.  Saat kamu meminta AI Agent (Cursor/Windsurf) untuk membuat fitur baru, tambahkan prompt:
    *"Please refer to `LOGGING_STANDARD.md` for how to handle logging and server actions."*

Ini akan memastikan kodemu bersih, konsisten, dan siap untuk scale-up ke Axiom nanti tanpa perlu refactor ulang.