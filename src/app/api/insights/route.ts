import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../postgres";
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
    // 1. Fetch ONLY root-level insights (insights with no parents in insight_links)
    const baseQuery = InsightModel.query()
      .where("insights.user_id", authUser.id!)
      .whereNotExists(InsightModel.relatedQuery("parents"))
      .whereRaw("LOWER(insights.title) LIKE LOWER(?)", [`%${searchQuery}%`])
      .orderBy("insights.updated_at", "desc");

    const paginatedInsightIdsSubquery = baseQuery
      .clone()
      .select("insights.id")
      .offset(offset)
      .limit(limit);

    // 2. Use withGraphFetched instead of withGraphJoined to fetch ALL child rows accurately
    const insights = (await InsightModel.query()
      .withGraphFetched(
        `[
      ${includeParents ? "parents.parentInsight," : ""}
      ${includeChildren ? "children.childInsight.evidence," : ""}
      ${includeEvidence ? "evidence" : ""}
    ]`,
      )
      .whereIn("insights.id", paginatedInsightIdsSubquery)
      .orderBy("insights.updated_at", "desc")) as InsightModel[];

    // 3. Clean up null graph mapping objects so empty child nodes don't render blank boxes
    const cleanedInsights = insights.map((insight) => ({
      ...insight,
      children: (insight.children || []).filter(
        (c) => c && c.childInsight !== null,
      ),
      parents: (insight.parents || []).filter(
        (p) => p && p.parentInsight !== null,
      ),
    })) as unknown as Insight[];

    return NextResponse.json(cleanedInsights);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

export type PostInsightsRouteRequestBody = Promise<{
  title?: string;
  description?: string;
  citations?: InsightEvidence[];
  evidence?: InsightEvidence[];
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
  try {
    const uid = Date.now().toString(36);
    const authUser = await getAuthUser(headers);

    if (!authUser?.id) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = body.title?.trim();
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const citations = body.citations ?? body.evidence;

    if (!title) {
      return NextResponse.json(
        { statusText: "Creating a new insight requires at least a title" },
        { status: 400 },
      );
    }

    // First create the insight without evidence
    const insertData: Partial<InsightModel> = {
      user_id: authUser.id,
      uid,
      title,
    };
    if (description !== undefined) {
      insertData.description = description;
    }

    const newInsight = (await InsightModel.query()
      .insert(insertData)
      .withGraphFetched("evidence")) as InsightModel;

    // Then add evidence if provided
    if (citations && citations.length > 0) {
      const { EvidenceModel } = await import("../models/evidence");
      await EvidenceModel.query().insert(
        citations.map((c) => ({
          summary_id: c.summary_id,
          insight_id: newInsight.id,
        })),
      );

      // Fetch the insight again with evidence
      const insightWithEvidence = (await InsightModel.query()
        .findById(newInsight.id!)
        .withGraphFetched("evidence")) as InsightModel | undefined;

      return NextResponse.json(insightWithEvidence || newInsight);
    }

    return NextResponse.json(newInsight);
  } catch (error) {
    console.error("Error in POST /api/insights:", error);
    return NextResponse.json(
      {
        statusText:
          error instanceof Error
            ? error.message
            : "Internal server error while creating insight",
      },
      { status: 500 },
    );
  }
}
