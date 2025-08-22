import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { url } = await req.json();
  if (url) {
    const html = await fetch(url).then((response) => response.text());
    if (html) {
      return NextResponse.json({ html });
    }
    return NextResponse.json(
      {
        message: "No no such article",
      },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { message: "url in body is required" },
    { status: 400 },
  );
}
