import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../api/db";
import { Insight, InsightEvidence } from "../../types";
import { getAuthUser } from "../../functions";
import { InsightModel } from "../models/insights";

export type GetInsightsRouteResponse = NextResponse<
  Insight[] | { statusText: string }
>;

export async function GET(req: NextRequest): Promise<GetInsightsRouteResponse> {
  const authUser = await getAuthUser(headers);
  const searchQuery = req.nextUrl.searchParams.get("query") || "";
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);
  const includeParents = Boolean(req.nextUrl.searchParams.get("parents"));
  const includeChildren = Boolean(req.nextUrl.searchParams.get("children"));
  const includeEvidence = Boolean(req.nextUrl.searchParams.get("evidence"));

  if (authUser) {
    const baseQuery = InsightModel.query()
      .where("insights.user_id", authUser.user_id)
      .where("insights.title", "ilike", `%${searchQuery}%`)
      .orderBy("insights.updated_at", "desc"); // important for paging

    const paginatedInsightIdsSubquery = baseQuery
      .clone() // Clone is crucial to not modify baseQuery
      .select("insights.id")
      .offset(offset)
      .limit(limit);

    const finalQuery = InsightModel.query()
      .withGraphJoined(
        `[
      ${includeParents ? "parents.parentInsight," : ""}
      ${includeChildren ? "children.childInsight.evidence," : ""}
      ${includeEvidence ? "evidence" : ""}
    ]`,
        { joinOperation: "leftJoin" }, // Use leftJoin to preserve all root insights
      )
      .whereIn("insights.id", paginatedInsightIdsSubquery) // Filter by the paginated IDs
      .orderBy("insights.updated_at", "desc"); // Maintain the order

    const insights = await finalQuery;

    return NextResponse.json(insights);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

export type PostInsightsRouteRequestBody = Promise<{
  title?: string;
  citations?: InsightEvidence[];
}>;

interface PostInsightsRouteRequest extends NextRequest {
  json: () => PostInsightsRouteRequestBody;
}

export type PostInsightsRouteResponse = NextResponse<
  Insight | { statusText: string }
>;

export async function POST(
  req: PostInsightsRouteRequest,
): Promise<PostInsightsRouteResponse> {
  const uid = Date.now().toString(36);
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const { title, citations } = await req.json();
    if (title) {
      const now = Date.now();
      const newInsight = await InsightModel.query()
        .insertGraph({
          user_id: authUser.user_id,
          uid,
          title,
          created_at: new Date(now).toLocaleDateString(),
          updated_at: new Date(now).toLocaleDateString(),
          evidence:
            citations?.map((c) => ({
              summary_id: c.summary_id,
            })) ?? [],
        } as Insight)
        .withGraphFetched("evidence");

      return NextResponse.json(newInsight);
    }
    return NextResponse.json(
      { statusText: "Creating a new insight requires at least a title" },
      { status: 400 },
    );
  }
  return NextResponse.json(
    {
      statusText: "Unauthorized",
    },
    { status: 401 },
  );
}
