import { NextRequest, NextResponse } from "next/server";

import "../../api/db";
import { Source } from "../../types";
import { SourceModel } from "../models/sources";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<Source | { message: string }>> {
  try {
    const { baseUrl } = await req.json();
    
    if (!baseUrl) {
      return NextResponse.json(
        { message: "baseUrl is required" },
        { status: 400 }
      );
    }

    // Validate baseUrl format
    try {
      new URL(`https://${baseUrl}`);
    } catch {
      return NextResponse.json(
        { message: "Invalid baseUrl format" },
        { status: 400 }
      );
    }

    // Check if source already exists
    const existingSource = await SourceModel.query()
      .where('baseurl', baseUrl)
      .first();

    if (existingSource) {
      return NextResponse.json(existingSource);
    }

    // Create new source
    const newSource = await SourceModel.query().insert({ 
      baseurl: baseUrl,
      logo_uri: null // Default to null, can be updated later
    });
    
    return NextResponse.json(newSource);
  } catch (err: any) {
    console.error("Error in POST /api/sources:", err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { message: "Source already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to create source" },
      { status: 500 }
    );
  }
}
