import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../postgres";
import { FactReaction } from "../../types";
import { getAuthUser } from "../../functions";
import { ReactionModel } from "../models/reactions";
import { ForeignKeyViolationError } from "objection";

export type PostRequestRouteRequestBody = Promise<{
  insight_id?: number;
  summary_id?: number;
  reaction: string;
}>;

interface PostReactionRouteRequest extends NextRequest {
  json: () => PostRequestRouteRequestBody;
}

export type PostReactionRouteResponse = NextResponse<
  FactReaction | { message: string; statusText?: string }
>;

export async function POST(
  req: PostReactionRouteRequest,
): Promise<PostReactionRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser && `${authUser.id}`.match(/^\d+$/)) {
    const { insight_id, summary_id, reaction } = await req.json();
    if (reaction && (insight_id || summary_id)) {
      try {
        const userId = Number(authUser.id);
        const insightId = insight_id ? Number(insight_id) : undefined;
        const summaryId = summary_id ? Number(summary_id) : undefined;

        let existingQuery = ReactionModel.query().where("user_id", userId);
        if (insightId) {
          existingQuery = existingQuery.where("insight_id", insightId);
        } else {
          existingQuery = existingQuery.whereNull("insight_id");
        }
        if (summaryId) {
          existingQuery = existingQuery.where("summary_id", summaryId);
        } else {
          existingQuery = existingQuery.whereNull("summary_id");
        }

        const existing = await existingQuery.first();
        let result: FactReaction;
        if (existing?.id) {
          result = await ReactionModel.query().patchAndFetchById(existing.id, {
            reaction,
          });
        } else {
          result = await ReactionModel.query().insertAndFetch({
            insight_id: insightId,
            summary_id: summaryId,
            reaction,
            user_id: userId,
          });
        }
        return NextResponse.json(result);
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
            message: "Unable to save reaction.",
            statusText: "Unable to save reaction.",
          },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      {
        message:
          "Request must include a valid reaction and either insight_id or summary_id",
        statusText:
          "Request must include a valid reaction and either insight_id or summary_id",
      },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { message: "Unauthorized", statusText: "Unauthorized" },
    { status: 401 },
  );
}
