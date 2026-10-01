import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

import "../postgres";
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
          const insertedLinks = await InsightLinkModel.query().insert(
            childrenToInsert,
          );
          const insertedIds = (
            Array.isArray(insertedLinks) ? insertedLinks : [insertedLinks]
          )
            .map((link) => link.id)
            .filter((id): id is number => typeof id === "number");

          const hydratedLinks = await InsightLinkModel.query()
            .findByIds(insertedIds)
            .withGraphFetched("[childInsight.evidence, parentInsight]");

          return NextResponse.json(hydratedLinks);
        } catch (err) {
          if (err instanceof ForeignKeyViolationError) {
            console.error("Foreign key violation:", err.message);
            return NextResponse.json(
              { statusText: "Either a child_id or parent_id is invalid" },
              { status: 409 },
            );
          }
          console.error("Other database error:", err);
          const message =
            err instanceof Error ? err.message : "Unable to create insight link";
          // Unique parent/child pairs (u_cp) and other DB failures
          const isUnique =
            typeof message === "string" &&
            (message.includes("u_cp") ||
              message.includes("duplicate key") ||
              message.includes("unique"));
          return NextResponse.json(
            {
              statusText: isUnique
                ? "That parent/child link already exists"
                : message,
            },
            { status: isUnique ? 409 : 500 },
          );
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
