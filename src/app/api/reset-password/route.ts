import { NextRequest, NextResponse } from "next/server";

import { UserLibSqlModel } from "../models/users";
import {
  clearSessionsForUser,
  getPasswordResetKey,
  hashPassword,
  isResetPayloadValid,
  updateUserPassword,
} from "../password/functions";

export type ResetPasswordRequestBody = Promise<{
  token: string;
  password: string;
}>;

interface ResetPasswordRequest extends NextRequest {
  json: () => ResetPasswordRequestBody;
}

export async function POST(req: ResetPasswordRequest): Promise<NextResponse> {
  const { token, password } = await req.json();
  const resetToken = token?.trim();
  const trimmedPassword = password?.trim();

  if (!resetToken || !trimmedPassword) {
    return NextResponse.json(
      { message: "Reset token and new password are required" },
      { status: 400 },
    );
  }

  if (trimmedPassword.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  // knex/libsql where* clauses need the raw DB column name; result rows are
  // still mapped to camelCase via Objection snakeCaseMappers.
  const candidates = (await UserLibSqlModel.query().whereNotNull(
    "password_reset_key",
  )) as Array<UserLibSqlModel & { passwordResetKey?: string | null }>;

  const user = candidates.find((row) =>
    isResetPayloadValid(getPasswordResetKey(row), resetToken),
  );

  if (!user?.id) {
    return NextResponse.json(
      {
        message: "Invalid or expired reset link. Please request a new one.",
      },
      { status: 400 },
    );
  }

  const encryptedPassword = await hashPassword(trimmedPassword);
  await updateUserPassword(user.id, encryptedPassword);
  await clearSessionsForUser(user.id);

  const response = NextResponse.json({
    message: "Password updated. You can log in with your new password.",
  });
  // Drop any pre-reset session cookie so /login does not treat the user as
  // already signed in with a now-invalid token.
  response.cookies.set("token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
