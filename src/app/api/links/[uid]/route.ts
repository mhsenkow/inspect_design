"use server";

import { NextRequest, NextResponse } from "next/server";

import "../../../api/db";
import { getPageHeaderImageUrl } from "./functions";
import { SummaryModel } from "../../models/summaries";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ uid: string }> },
): Promise<NextResponse<SummaryModel | { message: string }>> {
  const params = await props.params;
  const { uid } = params;

  const summary = await SummaryModel.query()
    .findOne("summaries.uid", uid)
    .withGraphJoined("source")
    .withGraphJoined("comments.user")
    .withGraphJoined("reactions");

  if (summary) {
    summary.imageUrl = await getPageHeaderImageUrl(summary.url);
    [summary.source_baseurl, summary.logo_uri] = [
      summary.source.baseurl,
      summary.source.logo_uri,
    ];

    return NextResponse.json(summary);
  } else {
    return NextResponse.json(
      { message: "No summary with that uid found" },
      { status: 404 },
    );
  }
}
