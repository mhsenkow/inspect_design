/**
 * Utility functions for creating URL-friendly slugs
 */

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function createSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[\s\W]+/g, "-")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length to 50 characters
      .substring(0, 50)
  );
}

/**
 * Creates a readable link URL slug from title and uid
 * @param title - The link title
 * @param uid - The unique identifier
 * @returns A readable URL slug
 */
export function createLinkSlug(title: string, uid: string): string {
  const titleSlug = createSlug(title);
  return `${titleSlug}-${uid}`;
}

/**
 * Extracts the uid from a link slug
 * @param slug - The full slug (e.g., "the-great-ai-job-massacre-mdhsrf15")
 * @returns The uid part of the slug
 */
export function extractUidFromSlug(slug: string): string | null {
  // Look for the last hyphen followed by an alphanumeric string (the uid)
  const match = slug.match(/-([a-z0-9]+)$/i);
  return match ? match[1] : null;
}

/**
 * Checks if a slug contains a uid (new format) or is just a uid (old format)
 * @param slug - The slug to check
 * @returns true if it's a new format slug, false if it's just a uid
 */
export function isNewFormatSlug(slug: string): boolean {
  return slug.includes("-") && /^[a-z0-9-]+-[a-z0-9]+$/i.test(slug);
}
