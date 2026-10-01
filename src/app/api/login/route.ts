import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createSession } from "../../../proxy/functions";
import { User } from "../../types";
import { UserLibSqlModel } from "../models/users";

export type PostLoginSessionRequestBody = Promise<{
  email: string;
  password: string;
}>;

interface PostLoginSessionRequest extends NextRequest {
  json: () => PostLoginSessionRequestBody;
}

export type PostLoginSessionResponse = NextResponse<User | { message: string }>;

export async function POST(
  req: PostLoginSessionRequest,
): Promise<PostLoginSessionResponse> {
  const { email, password } = await req.json();

  const normalizedEmail = email?.toLocaleLowerCase().trim();
  const trimmedPassword = password?.trim();

  if (!(normalizedEmail && trimmedPassword)) {
    return NextResponse.json(
      {
        message: "All input is required",
      },
      { status: 400 },
    );
  }

  const resultRows = await UserLibSqlModel.query().where(
    "email",
    normalizedEmail,
  );
  if (!resultRows || resultRows.length === 0) {
    return NextResponse.json(
      {
        message: "User does not exist. Please register.",
      },
      { status: 404 },
    );
  }
  const user = resultRows[0] as UserLibSqlModel;

  if (user?.password && (await bcrypt.compare(trimmedPassword, user.password))) {
    const token = await createSession(user);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    });
  }

  return NextResponse.json(
    {
      message: "Invalid credentials",
    },
    { status: 401 },
  );
}
