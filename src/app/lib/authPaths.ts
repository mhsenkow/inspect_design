/**
 * Only allow same-origin relative paths for post-auth redirects.
 * Blocks open redirects like //evil.com or https://evil.com.
 */
export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/insights",
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  return trimmed;
}

export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid credentials") ||
    lower.includes("does not exist") ||
    lower.includes("user not found")
  ) {
    return "Invalid email or password.";
  }
  return message;
}
