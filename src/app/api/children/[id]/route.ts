import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../../api/db";
import { InsightLinkModel } from "../../models/insight_links";
import { getAuthUser } from "../../../functions";

export interface DeleteChildInsightRouteProps {
  params: Promise<{ id: number }>;
}

export type DeleteChildInsightRouteResponse = NextResponse<{
  statusText?: string;
}>;

export async function DELETE(
  req: NextRequest,
  props: DeleteChildInsightRouteProps,
): Promise<DeleteChildInsightRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const params = await props.params;
    const id = Number(params.id);
    if (id && typeof id == "number") {
      const numberDeleted = await InsightLinkModel.query()
        .deleteById(id)
        .whereIn(
          "id",
          InsightLinkModel.query()
            .select("insight_links.id")
            .joinRelated("parentInsight")
            .where("parentInsight.user_id", authUser.user_id)
            .joinRelated("childInsight")
            .where("childInsight.user_id", authUser.user_id),
        );
      if (numberDeleted > 0) {
        return NextResponse.json({ statusText: "success" });
      }
      // return 404 either because deleteById returns 0 affected
      // meaning the evidence doesn't exist
      // OR it's someone else'se and returning 404 instead of 403 for security reasons
      return NextResponse.json(
        { statusText: "Child insight with specified id not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { statusText: "A valid id path parameter is required" },
      { status: 400 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
