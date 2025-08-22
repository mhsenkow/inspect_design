import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../../api/db";
import { EvidenceModel } from "../../models/evidence";
import { getAuthUser } from "../../../functions";

export interface DeleteEvidenceRouteProps {
  params: Promise<{ id: number }>;
}

export type DeleteEvidenceRouteResponse = NextResponse<{ statusText: string }>;

export async function DELETE(
  req: NextRequest,
  props: DeleteEvidenceRouteProps,
): Promise<DeleteEvidenceRouteResponse> {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const params = await props.params;
    const id = Number(params.id);
    if (id && typeof id == "number") {
      const numberDeleted = await EvidenceModel.query()
        .deleteById(id)
        .whereIn(
          "id",
          EvidenceModel.query()
            .select("evidence.id")
            .joinRelated("insight")
            .where("insight.user_id", authUser.user_id),
        );
      if (numberDeleted > 0) {
        return NextResponse.json({ statusText: "success" });
      }
      // return 404 either because deleteById returns 0 affected
      // meaning the evidence doesn't exist
      // OR it's someone else'se and returning 404 instead of 403 for security reasons
      return NextResponse.json(
        { statusText: "Evidence to delete not found" },
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
