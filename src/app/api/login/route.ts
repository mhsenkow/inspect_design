import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import "../../api/db";
import { getEncryptedToken } from "../../../middleware/functions";
import { User } from "../../types";
import { UserModel } from "../models/users";

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

  if (!(email && password)) {
    return NextResponse.json(
      {
        message: "All input is required",
      },
      { status: 400 },
    );
  }

  // TODO: track sessions (token) in the db someday?

  const resultRows = await UserModel.query().where(
    "email",
    email.toLocaleLowerCase().trim(),
  );
  if (!resultRows || resultRows.length == 0) {
    return NextResponse.json(
      {
        message: "User does not Exist. Please register",
      },
      { status: 404 },
    );
  }
  const user = resultRows[0];

  if (user && (await bcrypt.compare(password.trim(), user.password!))) {
    const token = getEncryptedToken(user);
    user.token = token;

    return NextResponse.json({
      ...user,
    });
  }
  return NextResponse.json(
    {
      message: "Invalid Credentials",
    },
    { status: 401 },
  );
}
