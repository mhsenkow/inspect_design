/** Objection snakeCaseMappers may serialize either snake_case or camelCase. */
export const prop = <T,>(
  obj: unknown,
  snake: string,
  camel: string,
): T | undefined => {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  return (record[snake] ?? record[camel]) as T | undefined;
};
