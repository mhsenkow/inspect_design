import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../postgres";
import { InsightModel } from "../../models/insights";
import { InsightLinkModel } from "../../models/insight_links";
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

async function collectDeletableDescendantIds(
  rootId: number,
): Promise<number[]> {
  const idsToDelete = new Set<number>([rootId]);
  let frontier = [rootId];

  const childIdOf = (link: {
    child_id?: number;
    childId?: number;
  }): number | undefined => link.childId ?? link.child_id;

  const parentIdOf = (link: {
    parent_id?: number;
    parentId?: number;
  }): number | undefined => link.parentId ?? link.parent_id;

  while (frontier.length > 0) {
    // where/select need raw DB column names; result rows may be camelCase.
    const childLinks = (await InsightLinkModel.query()
      .whereIn("parent_id", frontier)
      .select("child_id")) as Array<{ child_id?: number; childId?: number }>;

    const candidateIds = [
      ...new Set(
        childLinks
          .map((link) => childIdOf(link))
          .filter((id): id is number => typeof id === "number")
          .filter((id) => !idsToDelete.has(id)),
      ),
    ];

    if (candidateIds.length === 0) {
      break;
    }

    const parentLinks = (await InsightLinkModel.query()
      .whereIn("child_id", candidateIds)
      .select("child_id", "parent_id")) as Array<{
      child_id?: number;
      childId?: number;
      parent_id?: number;
      parentId?: number;
    }>;

    const parentsByChild = new Map<number, number[]>();
    for (const link of parentLinks) {
      const childId = childIdOf(link);
      const parentId = parentIdOf(link);
      if (typeof childId !== "number" || typeof parentId !== "number") {
        continue;
      }
      const parents = parentsByChild.get(childId) || [];
      parents.push(parentId);
      parentsByChild.set(childId, parents);
    }

    const nextFrontier: number[] = [];
    for (const childId of candidateIds) {
      const parents = parentsByChild.get(childId) || [];
      const hasExternalParent = parents.some(
        (parentId) => !idsToDelete.has(parentId),
      );
      if (!hasExternalParent) {
        idsToDelete.add(childId);
        nextFrontier.push(childId);
      }
    }

    frontier = nextFrontier;
  }

  return [...idsToDelete];
}

export async function DELETE(
  req: NextRequest,
  props: InsightRouteProps,
): Promise<DeleteInsightRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (!authUser?.id) {
    return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
  }

  const { uid } = await props.params;
  if (!(uid && uid.match(/^[a-z0-9]+$/))) {
    return NextResponse.json(
      { statusText: "A valid uid path parameter is required" },
      { status: 400 },
    );
  }

  const insight = (await InsightModel.query().findOne({
    uid,
    user_id: authUser.id,
  })) as InsightModel | undefined;

  if (!insight?.id) {
    return NextResponse.json(
      { statusText: "Insight not found" },
      { status: 404 },
    );
  }

  const idsToDelete =
    req.nextUrl.searchParams.get("cascade") === "1"
      ? await collectDeletableDescendantIds(insight.id)
      : [insight.id];
  await InsightModel.query().delete().whereIn("id", idsToDelete);

  return NextResponse.json({ statusText: "success" });
}
