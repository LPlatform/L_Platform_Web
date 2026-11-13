/**
 * Base URL for backend API calls.
 * - Local dev: NEXT_PUBLIC_API_URL=http://localhost:3001 (direct).
 * - Vercel: leave NEXT_PUBLIC_API_URL empty ("") so calls go to same-origin /api/*, which
 *   next.config.ts rewrites to BACKEND_URL. This keeps auth cookies first-party.
 */
export const API_BASE: string = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
