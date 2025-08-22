import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

import "../../api/db";
import { getAuthUser } from "../../functions";
import { InsightLinkModel } from "../models/insight_links";
import { InsightLink } from "../../types";
import { ForeignKeyViolationError } from "objection";

export type PostChildrenRouteRequestBody = Promise<{
  children: InsightLink[];
}>;

interface PostChildrenRouteRequest extends NextRequest {
  json: () => PostChildrenRouteRequestBody;
}

export type PostChildrenRouteResponse = NextResponse<
  InsightLinkModel[] | { statusText: string }
>;

export async function POST(
  req: PostChildrenRouteRequest,
): Promise<PostChildrenRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const { children } = await req.json();
    if (children) {
      const childrenToInsert = children
        .filter((c) => !!c.child_id && !!c.parent_id)
        .map((c) => ({
          child_id: c.child_id,
          parent_id: c.parent_id,
        }));
      if (childrenToInsert.length > 0) {
        try {
          const insertedLinks = await InsightLinkModel.query()
            .insert(childrenToInsert)
            .withGraphFetched("childInsight.evidence")
            .withGraphFetched("parentInsight");
          return NextResponse.json(insertedLinks);
        } catch (err) {
          if (err instanceof ForeignKeyViolationError) {
            console.error("Foreign key violation:", err.message);
            return NextResponse.json(
              { statusText: "Either a child_id or parent_id is invalid" },
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
            "Children objects must contain both child_id and parent_id",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { statusText: "Children field in body is required" },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
