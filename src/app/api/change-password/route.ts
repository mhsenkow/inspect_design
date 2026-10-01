import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import { getAuthUser } from "../../functions";
import { UserLibSqlModel } from "../models/users";
import {
  clearSessionsForUser,
  hashPassword,
  updateUserPassword,
} from "../password/functions";

export async function POST(req: Request): Promise<NextResponse> {
  const authUser = await getAuthUser(headers);
  if (!authUser?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const trimmedCurrent = currentPassword?.trim();
  const trimmedNew = newPassword?.trim();

  if (!trimmedCurrent || !trimmedNew) {
    return NextResponse.json(
      { message: "Current and new passwords are required" },
      { status: 400 },
    );
  }

  if (trimmedNew.length < 6) {
    return NextResponse.json(
      { message: "New password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = (await UserLibSqlModel.query().findById(authUser.id)) as
    | UserLibSqlModel
    | undefined;

  if (!user?.password) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const matches = await bcrypt.compare(trimmedCurrent, user.password);
  if (!matches) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 400 },
    );
  }

  const encryptedPassword = await hashPassword(trimmedNew);
  await updateUserPassword(user.id!, encryptedPassword);
  await clearSessionsForUser(user.id!);

  return NextResponse.json({
    message: "Password changed. Please log in again.",
  });
}
