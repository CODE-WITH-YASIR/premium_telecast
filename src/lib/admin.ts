/**
 * Server-side administrative authorization helpers.
 * Checks against ADMIN_EMAIL allowlist configured in environment variables (.env.local).
 */

export const ADMIN_EMAIL: string =
  process.env.ADMIN_EMAIL || "mohamedyasir2000@gmail.com";

/**
 * Checks if a given email has administrative privileges.
 * Performs safe, case-insensitive string matching.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}
