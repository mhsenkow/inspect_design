import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../postgres";
import { InsightModel } from "../../models/insights";
import { Insight, InsightEvidence } from "../../../types";
import { getAuthUser } from "../../../functions";

export interface InsightRouteProps {
  params: Promise<{ uid?: string }>;
}

export interface GetLinksSearchParams {
  offset: number;
  limit: number;
  includeNestedEvidenceTotals: boolean;
}

export type GetInsightRouteResponse = NextResponse<
  InsightModel | { statusText: string }
>;

export async function GET(
  req: NextRequest,
  props: InsightRouteProps,
): Promise<GetInsightRouteResponse> {
  const params = await props.params;
  const { uid } = params;
  if (!uid) {
    return NextResponse.json(
      { statusText: "A valid uid path parameter is required" },
      { status: 400 },
    );
  }

  // const evidenceOffset = Number(req.nextUrl.searchParams.get("offset") || 0);
  // const evidenceLimit = Number(req.nextUrl.searchParams.get("limit") || 20);
  const includeNestedEvidenceTotals = Boolean(
    req.nextUrl.searchParams.get("nestedEvidenceTotals"),
  );

  let query = InsightModel.query().findOne("insights.uid", uid);

  query = query.withGraphFetched({
    reactions: true,
    parents: { parentInsight: { reactions: true } },
    children: {
      childInsight: includeNestedEvidenceTotals
        ? {
            // TODO: separate the CTE modifier into its own API to, e.g., enable users to request aggegate counts after seeing direct counts
            $modify: ["selectTotalEvidenceCount"],
            // title: true,
            // children: { childInsight: true },
            reactions: true,
          }
        : {
            $modify: ["selectDirectEvidenceCount"],
            children: { $modify: ["selectDirectChildrenCount"] },
            reactions: true,
          },
    },
    comments: {
      $modify: ["selectDisplayAndUserJoinColumn"],
      user: { $modify: ["selectUsername"] },
    },
    evidence: {
      $modify: [
        "selectDisplayAndSummaryJoinColumn",
        // TODO: pagination of evidence does not work because of modifier formatting:
        // ["selectPagedEvidence", evidenceOffset, evidenceLimit],
      ],
      summary: { source: true, comments: { user: true }, reactions: true },
    },
  });

  const insight = await query;

  if (insight) {
    return NextResponse.json(insight);
  }
  return NextResponse.json(
    { statusText: "No insight found with that uid" },
    { status: 404 },
  );
}

export interface PatchReq extends NextRequest {
  json: () => Promise<{
    title?: string;
    description?: string;
    is_public?: boolean;
    isPublic?: boolean;
    evidence?: Pick<InsightEvidence, "summary_id">[];
    removeEvidence?: Pick<InsightEvidence, "summary_id">[];
    children?: Pick<Insight, "id">[];
    removeChildren?: Pick<Insight, "id">[];
  }>;
}

export interface PatchInsightRouteProps {
  params: Promise<{ uid?: string }>;
}

export async function PATCH(
  req: PatchReq,
  props: PatchInsightRouteProps,
): Promise<NextResponse<Insight | { statusText: string }>> {
  const authUser = await getAuthUser(headers);

  if (!authUser?.id) {
    return NextResponse.json(
      {
        statusText: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const params = await props.params;
  const { uid } = params;
  if (!uid || !uid.match(/^[0-9a-z]+$/)) {
    return NextResponse.json(
      {
        statusText: "A valid uid path paramter is required",
      },
      { status: 400 },
    );
  }

  const body = await req.json();
  const hasTitle = typeof body.title === "string";
  const hasDescription = typeof body.description === "string";
  const isPublicValue =
    typeof body.is_public === "boolean"
      ? body.is_public
      : typeof body.isPublic === "boolean"
        ? body.isPublic
        : undefined;
  const hasIsPublic = typeof isPublicValue === "boolean";

  if (!hasTitle && !hasDescription && !hasIsPublic) {
    return NextResponse.json(
      {
        statusText: "title, description, or is_public is required",
      },
      { status: 400 },
    );
  }

  if (hasTitle && !body.title!.trim()) {
    return NextResponse.json(
      {
        statusText: "title cannot be empty",
      },
      { status: 400 },
    );
  }

  try {
    const insight = await InsightModel.query()
      .findOne("uid", uid)
      .where("user_id", authUser.id);

    if (!insight?.id) {
      return NextResponse.json(
        {
          statusText: "Insight with that uid not found",
        },
        { status: 404 },
      );
    }

    const insightUpdateData: Partial<Insight> = {
      updated_at: new Date().toISOString(),
    };
    if (hasTitle) {
      insightUpdateData.title = body.title!.trim();
    }
    if (hasDescription) {
      insightUpdateData.description = body.description;
    }
    if (hasIsPublic) {
      insightUpdateData.is_public = isPublicValue;
    }

    const updated = await InsightModel.query().patchAndFetchById(
      insight.id,
      insightUpdateData,
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/insights/[uid] failed:", error);
    return NextResponse.json(
      {
        statusText:
          error instanceof Error ? error.message : "Unable to update insight",
      },
      { status: 500 },
    );
  }
}

export type DeleteInsightRouteResponse = NextResponse<{ statusText: string }>;

export async function DELETE(
  req: NextRequest,
  props: InsightRouteProps,
): Promise<DeleteInsightRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const { uid } = await props.params;
    if (uid && uid.match(/^[a-z0-9]+$/)) {
      await InsightModel.query().delete().where("uid", uid);
      return NextResponse.json({ statusText: "success" });
    }
    return NextResponse.json(
      { statusText: "A valid uid path parameter is required" },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
