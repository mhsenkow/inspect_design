import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../api/db";
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
  FactReaction | { statusText: string }
>;

export async function POST(
  req: PostReactionRouteRequest,
): Promise<PostReactionRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser && `${authUser.user_id}`.match(/^\d+$/)) {
    const { insight_id, summary_id, reaction } = await req.json();
    if (reaction && (insight_id || summary_id)) {
      try {
        const result = await ReactionModel.query()
          .insert({
            insight_id: insight_id ? Number(insight_id) : insight_id,
            summary_id: summary_id ? Number(summary_id) : summary_id,
            reaction,
            user_id: Number(authUser.user_id),
          })
          .onConflict(["user_id", "insight_id", "summary_id"])
          .merge({ reaction });
        return NextResponse.json(result);
      } catch (err) {
        if (err instanceof ForeignKeyViolationError) {
          console.error("Foreign key violation:", err.message);
          return NextResponse.json(
            { statusText: "Either the summary_id or insight_id is invalid" },
            { status: 409 },
          );
        } else {
          console.error("Other database error:", err);
          return NextResponse.json(
            { statusText: "Other database error: " + err },
            { status: 500 },
          );
        }
      }
    }
    return NextResponse.json(
      {
        statusText:
          "Request must include a valid reaction and either insight_id or summary_id",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
