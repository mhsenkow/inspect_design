import { NextRequest, NextResponse } from "next/server";

import "../../api/db";
import { Source } from "../../types";
import { SourceModel } from "../models/sources";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<Source | { statusText: string }>> {
  const { baseUrl } = await req.json();
  try {
    const newSource = await SourceModel.query().insert({ baseurl: baseUrl });
    return NextResponse.json(newSource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ statusText: err.toString() }, { status: 500 });
  }
}
