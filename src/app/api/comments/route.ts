import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import "../postgres";
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
  FactComment | { message: string; statusText?: string }
>;

export async function POST(
  req: PostCommentRequest,
): Promise<PostCommentResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser && `${authUser.id}`.match(/^\d+$/)) {
    const { insight_id, summary_id, comment } = await req.json();
    if (comment && (insight_id || summary_id)) {
      const commentToInsert = {
        insight_id: insight_id ? Number(insight_id) : insight_id,
        summary_id: summary_id ? Number(summary_id) : summary_id,
        comment,
        user_id: authUser.id,
      };
      try {
        const inserted =
          await CommentModel.query().insertAndFetch(commentToInsert);
        const newComment = await CommentModel.query()
          .findById(inserted.id!)
          .withGraphFetched("user");
        if (newComment?.user) {
          const safeUser = { ...newComment.user } as Record<string, unknown>;
          delete safeUser.password;
          delete safeUser.token;
          delete safeUser.passwordResetKey;
          delete safeUser.verificationKey;
          newComment.user = safeUser as unknown as typeof newComment.user;
        }
        return NextResponse.json(newComment ?? inserted);
      } catch (err) {
        if (err instanceof ForeignKeyViolationError) {
          console.error("Foreign key violation:", err.message);
          return NextResponse.json(
            {
              message: "Either the summary_id or insight_id is invalid",
              statusText: "Either the summary_id or insight_id is invalid",
            },
            { status: 409 },
          );
        }
        console.error("Other database error:", err);
        return NextResponse.json(
          {
            message: "Unable to save comment.",
            statusText: "Unable to save comment.",
          },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      {
        message:
          "Request must include a valid comment and either insight_id or summary_id",
        statusText:
          "Request must include a valid comment and either insight_id or summary_id",
      },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { message: "Unauthorized", statusText: "Unauthorized" },
    { status: 401 },
  );
}
