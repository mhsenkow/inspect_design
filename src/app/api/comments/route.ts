import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import "../../api/db";
import { FactComment } from "../../types";
import { getAuthUser } from "../../functions";
import { CommentModel } from "../models/comments";
import { ForeignKeyViolationError } from "objection";

export type PostCommentRequestBody = Promise<{
  insight_id?: number;
  summary_id?: number;
  comment: string;
}>;

interface PostCommentRequest extends NextRequest {
  json: () => PostCommentRequestBody;
}

export type PostCommentResponse = NextResponse<
  FactComment | { statusText: string }
>;

export async function POST(
  req: PostCommentRequest,
): Promise<PostCommentResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser && `${authUser.user_id}`.match(/^\d+$/)) {
    const { insight_id, summary_id, comment } = await req.json();
    if (comment && (insight_id || summary_id)) {
      const commentToInsert = {
        insight_id: insight_id ? Number(insight_id) : insight_id,
        summary_id: summary_id ? Number(summary_id) : summary_id,
        comment,
        user_id: Number(authUser.user_id),
      };
      try {
        const newComment = await CommentModel.query()
          .insert(commentToInsert)
          .withGraphFetched("user");
        return NextResponse.json(newComment);
      } catch (err) {
        if (err instanceof ForeignKeyViolationError) {
          console.error("Foreign key violation:", err.message);
          return NextResponse.json(
            { statusText: "Either the summary_id or insight_id is invalid" },
            { status: 409 },
          );
        } else {
          console.error("Other database error:", err);
          throw err;
        }
      }
    }
    return NextResponse.json(
      {
        statusText:
          "Request must include a valid comment and either insight_id or summary_id",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
