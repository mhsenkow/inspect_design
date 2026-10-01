"use server";

import { NextRequest, NextResponse } from "next/server";

import "../../postgres";
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
    try {
      summary.imageUrl = await getPageHeaderImageUrl(summary.url);
    } catch (error) {
      console.error("Failed to fetch page header image:", error);
      summary.imageUrl = undefined;
    }
    summary.source_baseurl = summary.source?.baseurl;
    summary.logo_uri = summary.source?.logo_uri;

    return NextResponse.json(summary);
  } else {
    return NextResponse.json(
      { message: "No summary with that uid found" },
      { status: 404 },
    );
  }
}
