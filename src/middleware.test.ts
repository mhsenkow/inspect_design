/**
 * @jest-environment node
 */
import { cookies, headers } from "next/headers";
import { middleware, ANONYMOUS_REGEXES } from "./middleware";
import { decryptToken } from "./middleware/functions";
import { NextRequest } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";

jest.mock("next/headers");
jest.mock("./middleware/functions");

describe("middleware", () => {
  let req: Pick<NextRequest, "nextUrl">;

  beforeEach(() => {
    req = {
      nextUrl: {
        pathname: "/",
        href: "http://localhost:3000/",
        origin: "http://localhost:3000",
      } as NextURL,
    };
    (cookies as jest.Mock).mockResolvedValue(new Map());
    (headers as jest.Mock).mockResolvedValue(new Map());
  });

  it("should allow anonymous access to paths matching ANONYMOUS_REGEXES", async () => {
    await Promise.all(
      ANONYMOUS_REGEXES.map(async (regex) => {
        req.nextUrl.pathname = regex
          .replace("^", "")
          .replace("$", "")
          .replace(".*", "asdf")
          .replace("[0-9]+", "123");
        const response = await middleware(req as NextRequest);
        expect(response.status).toBe(200);
      }),
    );
  });

  it("should return 403 if no token is provided and path does not match ANONYMOUS_REGEXES", async () => {
    req.nextUrl.pathname = "/protected";
    const response = await middleware(req as NextRequest);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.statusText).toBe("A token is required for authentication");
  });

  it("should set x-url and x-origin headers correctly", async () => {
    // first: req associated with localhost:3000 (beforeEach above)
    req.nextUrl.pathname = "/login";
    const response = await middleware(req as NextRequest);
    expect(response.headers.get("x-url")).toBe("http://localhost:3000/");
    expect(response.headers.get("x-origin")).toBe("http://localhost:3000");

    // then: req associated with datagotchi.net
    const oldReq = req;
    req = {
      nextUrl: {
        pathname: "/",
        href: "https://inspect.datagotchi.net/",
        origin: "https://inspect.datagotchi.net",
      } as NextURL,
    };
    const response2 = await middleware(req as NextRequest);
    expect(response2.headers.get("x-url")).toBe(
      "https://inspect.datagotchi.net/",
    );
    expect(response2.headers.get("x-origin")).toBe(
      "https://inspect.datagotchi.net",
    );

    // restore req to localhost:3000
    req = oldReq;
  });

  it("should set x-authUser header if token is valid", async () => {
    const token = "valid-token";
    (cookies as jest.Mock).mockResolvedValue(
      new Map([["token", { value: token }]]),
    );
    (headers as jest.Mock).mockResolvedValue(
      new Map([["x-access-token", token]]),
    );
    (decryptToken as jest.Mock).mockReturnValue({ id: 1, name: "Test User" });

    const response = await middleware(req as NextRequest);
    expect(response.headers.get("x-authUser")).toBe(
      JSON.stringify({ id: 1, name: "Test User" }),
    );
  });

  it("should not set x-authUser header if token is invalid", async () => {
    const token = "invalid-token";
    (cookies as jest.Mock).mockResolvedValue(
      new Map([["token", { value: token }]]),
    );
    (headers as jest.Mock).mockResolvedValue(
      new Map([["x-access-token", token]]),
    );
    (decryptToken as jest.Mock).mockReturnValue(null);

    const response = await middleware(req as NextRequest);
    expect(response.headers.get("x-authUser")).toBeNull();
  });
});
