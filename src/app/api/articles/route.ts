import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { message: "url in body is required" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { message: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Try multiple strategies to fetch the URL
    const strategies: RequestInit[] = [
      // Strategy 1: Full browser headers
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      },
      // Strategy 2: Minimal headers
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkBot/1.0)',
          'Accept': 'text/html',
        },
      },
      // Strategy 3: No headers (fallback)
      {
        headers: {},
      }
    ];

    let response;
    let lastError;

    for (const strategy of strategies) {
      try {
        response = await fetch(url, {
          ...strategy,
          signal: AbortSignal.timeout(8000), // 8 second timeout per attempt
        });
        
        if (response.ok) {
          break; // Success, exit the loop
        }
      } catch (error) {
        lastError = error;
        continue; // Try next strategy
      }
    }

    if (!response) {
      throw lastError || new Error('All fetch strategies failed');
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          message: `Website blocked our request (${response.status} ${response.statusText}). Try a different URL or the site may not allow automated access.`,
          status: response.status 
        },
        { status: response.status },
      );
    }

    const html = await response.text();
    
    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { message: "No content found at URL" },
        { status: 404 },
      );
    }

    return NextResponse.json({ html });
    
  } catch (error) {
    console.error("Error in /api/articles:", error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { message: "Request timeout - URL took too long to respond" },
          { status: 408 },
        );
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { message: "Network error - unable to reach URL" },
          { status: 502 },
        );
      }
    }
    
    return NextResponse.json(
      { message: "Internal server error while fetching article" },
      { status: 500 },
    );
  }
}
