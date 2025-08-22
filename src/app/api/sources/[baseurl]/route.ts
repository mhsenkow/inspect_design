"use server";

import { NextRequest, NextResponse } from "next/server";

import "../../../api/db";
import { Source } from "../../../types";
import { SourceModel } from "../../models/sources";

export interface GetSourceRouteProps {
  params: Promise<{ baseurl: string }>;
}

export type GetSourceRouteResponse = NextResponse<Source | { message: string }>;

export async function GET(
  req: NextRequest,
  props: GetSourceRouteProps,
): Promise<GetSourceRouteResponse> {
  const params = await props.params;
  const source = await SourceModel.query().findOne("baseurl", params.baseurl);
  if (source) {
    return NextResponse.json(source);
  }
  return NextResponse.json({ message: "No such source" }, { status: 404 });
}
