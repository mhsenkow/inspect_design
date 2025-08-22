import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UniqueViolationError } from "objection";

import "../../api/db";
import { User } from "../../types";
import { getEncryptedToken } from "../../../middleware/functions";
import { UserModel } from "../models/users";

export type RegisterPostRouteRequestBody = Promise<{
  username: string;
  email: string;
  password: string;
  enable_email_notifications: boolean;
}>;

interface RegisterPostRouteRequest extends NextRequest {
  json: () => RegisterPostRouteRequestBody;
}

export type RegisterPostRouteResponse = NextResponse<
  User | { message: string }
>;

export async function POST(
  req: RegisterPostRouteRequest,
): Promise<RegisterPostRouteResponse> {
  const { username, email, password } = await req.json();

  if (!(email && password && username)) {
    return NextResponse.json(
      { message: "All input is required" },
      { status: 400 },
    );
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await UserModel.query().insert({
      username,
      email: email.toLocaleLowerCase().trim(),
      password: encryptedPassword,
    });

    const token = getEncryptedToken(user);

    await UserModel.query()
      .patch({
        token,
      })
      .where("id", user.id!);

    user.token = token;
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (
      error instanceof UniqueViolationError &&
      error.columns.includes("email")
    ) {
      return NextResponse.json(
        { message: "User Already Exists. Please Login" },
        { status: 401 },
      );
    }
    console.error("Error during user registration:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
