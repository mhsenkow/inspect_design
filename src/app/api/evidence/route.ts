import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

import "../../api/db";
import { getAuthUser } from "../../functions";
import { EvidenceModel } from "../models/evidence";
import { InsightEvidence } from "../../types";
import { ForeignKeyViolationError } from "objection";

export type PostEvidenceRouteRequestBody = Promise<{
  evidence?: Partial<InsightEvidence>[];
}>;

interface PostEvidenceRouteRequest extends NextRequest {
  json: () => PostEvidenceRouteRequestBody;
}

export type PostEvidenceRouteResponse = NextResponse<
  EvidenceModel[] | { statusText: string }
>;

export async function POST(
  req: PostEvidenceRouteRequest,
): Promise<PostEvidenceRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const { evidence } = await req.json();
    if (evidence) {
      const evidenceToInsert = evidence
        .filter((e) => !!e.summary_id && !!e.insight_id)
        .map((e) => ({
          summary_id: e.summary_id,
          insight_id: e.insight_id,
        }));
      if (evidenceToInsert.length > 0) {
        try {
          const insertedEvidence = await EvidenceModel.query()
            .insert(evidenceToInsert)
            .withGraphFetched("summary.source");
          return NextResponse.json(insertedEvidence);
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
            "Evidence objects must contain both summary_id and insight_id",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { statusText: "Evidence field in body is required" },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
