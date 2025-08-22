import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import "../../api/db";
import { User } from "../../types";
import { getAuthUser } from "../../functions";
import { UserModel } from "../models/users";

export type PutUsersRouteRequestBody = Promise<{
  email: string;
  password: string;
  enable_push_notifications: boolean;
  enable_email_notifications: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}>;

interface PutUsersRouteRequest extends NextRequest {
  json: () => PutUsersRouteRequestBody;
}

export type PutUsersRouteResponse = NextResponse<User | { statusText: string }>;

export async function PATCH(
  req: PutUsersRouteRequest,
): Promise<PutUsersRouteResponse> {
  const reqBody = await req.json();
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const user = await UserModel.query().patchAndFetchById(authUser.user_id, {
      email: reqBody.email?.toLocaleLowerCase(),
      password: reqBody.password
        ? await bcrypt.hash(reqBody.password, 10)
        : undefined,
    });
    return NextResponse.json(user);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
