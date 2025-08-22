import { User } from "../app/types";

export const getEncryptedToken = (user: User): string => {
  // TODO: use a non-`crypto` encryption library OR nextauth (bc NextJS can't use Node.js here)
  // for now, it's a manual hack
  const valueToEncrypt = btoa(
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      username: user.username,
    }),
  );
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
): { user_id: number; email: string; username: string } => {
  if (!tokenKey) {
    tokenKey = process.env.TOKEN_KEY;
  }
  if (tokenKey) {
    const keyIntegers = tokenKey.split("").map((char) => char.charCodeAt(0));
    const tokenIntegers = decodeURIComponent(token)
      .split("")
      .map((char) => char.charCodeAt(0));
    const intermediateString = tokenIntegers
      .map((tokenCharInt, i) =>
        String.fromCharCode(tokenCharInt - keyIntegers[i % keyIntegers.length]),
      )
      .join("");
    const jsonStr = atob(intermediateString);
    return JSON.parse(jsonStr);
  }
  throw new Error("Missing token key");
};
