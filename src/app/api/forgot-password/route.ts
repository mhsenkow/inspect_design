import { NextRequest, NextResponse } from "next/server";

import { UserLibSqlModel } from "../models/users";
import { setPasswordResetKey } from "../password/functions";

export type ForgotPasswordRequestBody = Promise<{
  email: string;
}>;

interface ForgotPasswordRequest extends NextRequest {
  json: () => ForgotPasswordRequestBody;
}

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link has been created.";

export async function POST(req: ForgotPasswordRequest): Promise<NextResponse> {
  const { email } = await req.json();
  const normalizedEmail = email?.toLocaleLowerCase().trim();

  if (!normalizedEmail) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const user = (await UserLibSqlModel.query().findOne({
    email: normalizedEmail,
  })) as UserLibSqlModel | undefined;

  // Always return a generic success message to avoid account enumeration.
  if (!user?.id) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const { token } = await setPasswordResetKey(user);
  const origin =
    req.headers.get("origin") ||
    req.headers.get("x-origin") ||
    "http://localhost:3000";
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
  const resetUrl = `${origin}${resetPath}`;

  // No email provider wired yet — expose the link in development so local
  // recovery works. Production should send email and omit resetUrl/resetPath.
  const isDev =
    process.env.NODE_ENV !== "production" ||
    process.env.IS_LOCAL_PRODUCTION === "true" ||
    process.env.EXPOSE_PASSWORD_RESET_LINK === "true";

  console.info(`[password-reset] ${normalizedEmail} → ${resetUrl}`);

  return NextResponse.json({
    message: isDev
      ? "Password reset link created. Use the local link below (email is not configured yet)."
      : GENERIC_MESSAGE,
    ...(isDev ? { resetUrl, resetPath } : {}),
  });
}
