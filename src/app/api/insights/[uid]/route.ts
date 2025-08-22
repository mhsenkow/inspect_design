import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { NextURL } from "next/dist/server/web/next-url";

import "../../../api/db";
import { InsightModel } from "../../models/insights";
import { Insight, InsightEvidence } from "../../../types";
import { getAuthUser } from "../../../functions";
import { EvidenceModel } from "../../models/evidence";

export interface InsightRouteProps {
  params: Promise<{ uid?: string }>;
}

export interface GetLinksSearchParams {
  offset: number;
  limit: number;
  includeNestedEvidenceTotals: boolean;
}

export interface GetInsightRouteRequest extends NextRequest {
  nextUrl: NextURL & {
    searchParams: URLSearchParams & GetLinksSearchParams;
  };
}

export type GetInsightRouteResponse = NextResponse<
  InsightModel | { statusText: string }
>;

export async function GET(
  req: GetInsightRouteRequest,
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

  const evidenceOffset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const evidenceLimit = Number(req.nextUrl.searchParams.get("limit") || 20);
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
            // FIXME: separate the CTE modifier into its own API to, e.g., enable users to request aggegate counts after seeing direct counts
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
        // FIXME: pagination of evidence does not work because of modifier formatting:
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
    is_public?: boolean;
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
  // TODO: update the insights::update_at field
  const authUser = await getAuthUser(headers);

  if (authUser) {
    const params = await props.params;
    const { uid } = params;
    if (uid && uid.match(/^[0-9a-z]+$/)) {
      const { title: newTitle, is_public: newIsPublic } = await req.json();
      if (newTitle || newIsPublic) {
        const insight = await InsightModel.query()
          .findOne("uid", uid)
          .where("user_id", authUser.user_id);
        if (insight) {
          const insightUpdateData: Partial<Insight> = {
            updated_at: new Date().toDateString(),
          };
          if (newTitle) {
            insightUpdateData.title = newTitle;
          }
          if (newIsPublic) {
            insightUpdateData.is_public = newIsPublic;
          }

          await InsightModel.query()
            .patch(insightUpdateData)
            .where("id", insight.id!);

          return NextResponse.json(insightUpdateData as Insight);
        }
        return NextResponse.json(
          {
            statusText: "Insight with that uid not found",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          statusText: "New title or is_public are required",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        statusText: "A valid uid path paramter is required",
      },
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
