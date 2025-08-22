import { NextRequest, NextResponse } from "next/server";

import { cookies, headers } from "next/headers";
import { decryptToken } from "./middleware/functions";

export const ANONYMOUS_REGEXES = [
  "^/_next",
  "^/images",
  "/bootstrap",
  "^/$",
  "^/favicon.ico$",
  "^/links/.*",
  "^/insights",
  "^/login",
  "^/register",
  "^/confirm",
  "^/api/links",
  "^/api/insights",
  "^/api/register",
  "^/api/login",
  "^/api/users/[0-9]+$",
  "^/api/articles",
];

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  const cookiesCollection = await cookies();
  const tokenCookie = cookiesCollection.has("token")
    ? cookiesCollection.get("token")?.value
    : "";
  const headersObject = await headers();
  const token = headersObject.get("x-access-token") || tokenCookie;
  let authUser;
  // TODO: figure out why x-access-token is sometimes the 'undefined' string
  if (token && token !== "undefined") {
    authUser = decryptToken(token);
  }
  const anonymousPathMatch = ANONYMOUS_REGEXES.find((regex) =>
    req.nextUrl.pathname.match(new RegExp(regex)),
  );
  if (!anonymousPathMatch && !token) {
    return NextResponse.json(
      {
        statusText: "A token is required for authentication",
      },
      { status: 403 },
    );
  }

  let origin = req.nextUrl.origin;
  let url = req.nextUrl.href;

  if (process.env.NODE_ENV === "production") {
    origin = origin.replace(
      /http:\/\/localhost:3000/,
      "https://inspect.datagotchi.net",
    );
    url = url.replace(
      /http:\/\/localhost:3000/,
      "https://inspect.datagotchi.net",
    );
  }

  const res = NextResponse.next();
  res.headers.set("x-origin", origin);
  res.headers.set("x-url", url);

  if (authUser) {
    res.headers.set("x-authUser", JSON.stringify(authUser));
  }

  return res;
};
