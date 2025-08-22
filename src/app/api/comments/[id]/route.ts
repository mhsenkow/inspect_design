import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../../api/db";
import { getAuthUser } from "../../../functions";
import { CommentModel } from "../../models/comments";

export interface DeleteCommentRouteProps {
  params: Promise<{ id?: number }>;
}

export type DeleteCommentRouteResponse = NextResponse<{ statusText: string }>;

export async function DELETE(
  req: NextRequest,
  props: DeleteCommentRouteProps,
): Promise<DeleteCommentRouteResponse> {
  const params = await props.params;
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const rowCount = await CommentModel.query()
      .deleteById(Number(params.id))
      .whereIn(
        "id",
        CommentModel.query()
          .select("comments.id")
          .joinRelated("user")
          .where("comments.user_id", authUser.user_id),
      );
    if (rowCount > 0) {
      return NextResponse.json({ statusText: "success" });
    } else {
      return NextResponse.json(
        { statusText: "Comment to delete not found" },
        { status: 404 },
      );
    }
  }
  return NextResponse.json(
    { statusText: "No logged-in user" },
    { status: 401 },
  );
}
