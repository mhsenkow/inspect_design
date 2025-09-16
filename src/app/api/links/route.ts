import { NextRequest, NextResponse } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";
import { raw } from "objection";

import "../../api/db";
import { SummaryModel } from "../models/summaries";

export interface GetLinksSearchParams {
  offset: number;
  limit: number;
  query: string | null;
}

export interface GetLinksRequest extends NextRequest {
  nextUrl: NextURL & {
    searchParams: URLSearchParams & GetLinksSearchParams;
  };
}

export type GetLinksResponse = NextResponse<SummaryModel[]>;

export async function GET(req: GetLinksRequest): Promise<GetLinksResponse> {
  const searchParams = req.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "20");

  const query = searchParams.get("query")
    ? decodeURIComponent(searchParams.get("query") || "")
    : "";

  const summariesPage = await SummaryModel.query()
    .where(
      raw("lower(??)", ["title"]),
      "like",
      `%${query.toLocaleLowerCase()}%`,
    )
    .withGraphJoined("reactions")
    .withGraphJoined("comments.user")
    .orderBy("updated_at", "desc")
    .page(offset, limit);

  return NextResponse.json(summariesPage.results);
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<SummaryModel | { message: string }>> {
  try {
    const uid = Date.now().toString(36);
    const { url, source_id, title } = await req.json();

    if (!url || !source_id || !title) {
      return NextResponse.json(
        {
          message: "Invalid request: url, source_id, and title are required",
        },
        {
          status: 400,
        },
      );
    }

    // Check if URL already exists
    const existingSummary = await SummaryModel.query()
      .where("url", url)
      .withGraphFetched("source")
      .first();

    if (existingSummary) {
      // Return existing summary instead of creating a duplicate
      return NextResponse.json(existingSummary);
    }

    // Create new summary if URL doesn't exist
    const now = new Date();
    const newSummary = await SummaryModel.query()
      .insert({
        url,
        source_id,
        title,
        uid,
        created_at: now,
        updated_at: now,
      })
      .withGraphFetched("source");

    return NextResponse.json(newSummary);
  } catch (error) {
    console.error("Error in POST /api/links:", error);
    return NextResponse.json(
      {
        message: "Internal server error while creating link",
      },
      {
        status: 500,
      },
    );
  }
}
