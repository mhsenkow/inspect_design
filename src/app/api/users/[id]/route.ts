import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../../api/db";
import { User } from "../../../types";
import { getAuthUser } from "../../../functions";
import { UserModel } from "../../models/users";

export interface GetUserRouteProps {
  params: Promise<{ id: number }>;
}

export type GetUserRouteResponse = NextResponse<User | { message: string }>;

export async function GET(
  req: NextRequest,
  props: GetUserRouteProps,
): Promise<GetUserRouteResponse> {
  const params = await props.params;
  const { id } = params;
  const user = await UserModel.query().findById(id);
  //.withGraphJoined("followers");

  if (!user) {
    return NextResponse.json(
      {
        message: `User not found with ID: ${id}`,
      },
      { status: 404 },
    );
  }
  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: number }> },
): Promise<NextResponse> {
  const params = await props.params;
  const requestUserId = params.id;
  const authUser = await getAuthUser(headers);
  if (authUser) {
    if (authUser.user_id == requestUserId) {
      return (
        UserModel.query()
          .deleteById(authUser.user_id)
          .then(() => {
            return NextResponse.json({ statusText: "success" });
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .catch((err: any) => {
            const statusText =
              err instanceof Error ? err.message : err.toString();
            return NextResponse.json({ statusText }, { status: 500 });
          })
      );
    }
    return NextResponse.json({ statusText: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
