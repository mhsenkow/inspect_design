import { User } from "../app/types";
import { SessionModel } from "../app/api/models/sessions";
import libSqlKnexInstance from "../app/api/libsql";

export const createSession = async (user: User): Promise<string> => {
  // DEBUG
  SessionModel.knex(libSqlKnexInstance);

  // 1. Generate a secure, random token using the Web Crypto API,
  // which is available in Node.js, browsers, and Edge environments.
  const randomBytes = new Uint8Array(48);
  crypto.getRandomValues(randomBytes);
  const sessionToken = Buffer.from(randomBytes).toString("hex");

  // 2. Set an expiration date (e.g., 30 days from now).
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  await SessionModel.query().insert({
    user_id: user.id!,
    token: sessionToken,
    expires: expires.toISOString(),
  } as Partial<SessionModel>);

  return sessionToken;
};

export const verifyTokenAndGetUser = async (
  token: string,
): Promise<User | null> => {
  try {
    // 1. Find the session using the Objection.js model and query builder.
    // We'll eagerly load the related user with `withGraphFetched`.
    const session = (await SessionModel.query()
      .findOne({ token })
      .where("expires", ">", new Date().toISOString())
      .withGraphFetched("user")) as SessionModel | undefined;

    // 2. If no session is found, or the session has no associated user,
    // the token is invalid.
    if (!session?.user) {
      return null;
    }

    // 3. If the session is valid, return the user object.
    // Objection.js automatically handles mapping the row to the User model instance,
    // so no manual casting or boolean conversion is needed.
    const userWithoutPassword = session.user;
    session.user.token = token;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};
