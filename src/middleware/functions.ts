import { User } from "../app/types";

export const getEncryptedToken = (user: User): string => {
  // TODO: use a non-`crypto` encryption library OR nextauth (bc NextJS can't use Node.js here)
  // for now, it's a manual hack
  const valueToEncrypt = Buffer.from(
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      username: user.username,
    }),
  ).toString("base64");
  const keyIntegers = process.env
    .TOKEN_KEY!.split("")
    .map((char) => char.charCodeAt(0));
  const valueIntegers = valueToEncrypt
    .split("")
    .map((char) => char.charCodeAt(0));
  const newIntegers = valueIntegers.map(
    (valueInt, i) => valueInt + keyIntegers[i % keyIntegers.length],
  );
  return newIntegers.map((int) => String.fromCharCode(int)).join("");
};

export const decryptToken = (
  token: string,
  tokenKey?: string,
): { user_id: number; email: string; username: string } | null => {
  if (!tokenKey) {
    tokenKey = process.env.TOKEN_KEY;
  }
  if (!tokenKey || !token) {
    return null;
  }

  try {
    // First, try to decode the token safely
    let decodedToken: string;
    try {
      decodedToken = decodeURIComponent(token);
    } catch {
      // If URL decoding fails, the token is corrupted
      return null;
    }

    const keyIntegers = tokenKey.split("").map((char) => char.charCodeAt(0));
    const tokenIntegers = decodedToken
      .split("")
      .map((char) => char.charCodeAt(0));

    const intermediateString = tokenIntegers
      .map((tokenCharInt, i) =>
        String.fromCharCode(tokenCharInt - keyIntegers[i % keyIntegers.length]),
      )
      .join("");

    // Validate that the intermediate string looks like base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(intermediateString)) {
      return null;
    }

    const jsonStr = Buffer.from(intermediateString, "base64").toString("utf-8");

    // Validate that the JSON string looks reasonable
    if (!jsonStr.startsWith("{") || !jsonStr.includes('"user_id"')) {
      return null;
    }

    const parsed = JSON.parse(jsonStr);

    // Validate the parsed object has required fields
    if (!parsed.user_id || !parsed.email || !parsed.username) {
      return null;
    }

    return parsed;
  } catch (error) {
    // Silently fail for any decryption errors
    return null;
  }
};
