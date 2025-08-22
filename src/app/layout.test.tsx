/**
 * @jest-environment node
 */
/* eslint-disable jest/no-disabled-tests */
import React from "react";
import { cookies, headers } from "next/headers";

import { getUserFromServer } from "./api/functions";
import Dashboard from "./layout";

jest.mock("next/headers");
jest.mock("./api/functions");

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Logged in", () => {
    it("should fetch token cookie and user data", async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: "mockToken" }),
      };
      // const mockHeaders = {
      //   get: jest.fn().mockImplementation((header) => {
      //     if (header == "x-authUser") {
      //       return JSON.stringify({ user_id: "123" });
      //     }
      //     if (header == "x-origin") {
      //       return "mockOrigin";
      //     }
      //     return null;
      //   }),
      // };
      const mockUser = { avatar_uri: "mockAvatarUri" };

      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      // (headers as jest.Mock).mockResolvedValue(mockHeaders);
      (getUserFromServer as jest.Mock).mockResolvedValue(mockUser);

      const props = { children: <div>Test</div> };
      const result = await Dashboard(props);

      expect(cookies).toHaveBeenCalled();
      // expect(headers).toHaveBeenCalled();
      // expect(getUserFromServer).toHaveBeenCalledWith(
      //   "mockOrigin",
      //   { id: "123" },
      //   "mockToken",
      // );
      expect(result).toBeDefined();
    });

    it.skip("should return Log Out and My Insights links", async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: "mockToken" }),
      };
      // const mockHeaders = {
      //   get: jest.fn().mockImplementation((header) => {
      //     if (header == "x-authUser") {
      //       return JSON.stringify({ user_id: "123" });
      //     }
      //     if (header == "x-origin") {
      //       return "mockOrigin";
      //     }
      //     return null;
      //   }),
      // };
      const mockUser = { avatar_uri: "mockAvatarUri" };

      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      // (headers as jest.Mock).mockResolvedValue(mockHeaders);
      (getUserFromServer as jest.Mock).mockResolvedValue(mockUser);

      const props = { children: <div>Test</div> };
      const resultJsx = await Dashboard(props);

      const head = resultJsx.props.children[0];
      expect(head).toBeDefined();
      const body = resultJsx.props.children[1];
      expect(body).toBeDefined();
      expect(body.type).toBe("body");
      expect(Array.isArray(body.props.children)).toBe(true);
      expect(body.props.children.length).toBe(2);
      const div = body.props.children[0];
      expect(div).toBeDefined();
      expect(div.type).toBe("div");
      expect(div.props.children.length).toBe(3); // nav, h1 inspect brand, div dg brand
      const nav = div.props.children[0];
      expect(nav).toBeDefined();
      expect(nav.type).toBe("nav");
      const ul = nav.props.children;
      expect(ul).toBeDefined();
      expect(ul.type).toBe("ul");
      const loginRegisterLinks = ul.props.children;
      expect(loginRegisterLinks).toBeDefined();
      expect(typeof loginRegisterLinks.type).toBe("function");
      // expect(loginRegisterLinks.props.children.length).toBe(2);
      // const logOutLi = loginRegisterLinks.props.children[0];
      // expect(logOutLi).toBeDefined();
      // expect(logOutLi.type).toBe("li");
      // expect(logOutLi.props.children.length).toBe(1);
      // const logOutSpan = logOutLi.props.children[0];
      // expect(logOutSpan).toBeDefined();
      // expect(logOutSpan.type).toBe("span");
      // expect(logOutSpan.props.children[0]).toEqual("Log Out");
      // const myInsightsLi = loginRegisterLinks.props.children[1];
    });
  });
  describe("Not logged in", () => {
    it("should handle missing token cookie", async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(null),
      };
      // const mockHeaders = {
      //   get: jest.fn().mockImplementation((header) => {
      //     if (header == "x-authUser") {
      //       return null;
      //     }
      //     if (header == "x-origin") {
      //       return "mockOrigin";
      //     }
      //     return null;
      //   }),
      // };

      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      // (headers as jest.Mock).mockResolvedValue(mockHeaders);

      const props = { children: <div>Test</div> };
      const result = await Dashboard(props);

      expect(cookies).toHaveBeenCalled();
      // expect(headers).toHaveBeenCalled();
      expect(getUserFromServer).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle missing auth user header", async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: "mockToken" }),
      };
      const mockHeaders = {
        get: jest.fn().mockImplementation((header) => {
          if (header == "x-authUser") {
            return null;
          }
          if (header == "x-origin") {
            return "mockOrigin";
          }
          return null;
        }),
      };

      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      (headers as jest.Mock).mockResolvedValue(mockHeaders);

      const props = { children: <div>Test</div> };
      const result = await Dashboard(props);

      expect(cookies).toHaveBeenCalled();
      // expect(headers).toHaveBeenCalled();
      expect(getUserFromServer).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  it.skip("should show Login and Register links", async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(null),
    };
    const mockHeaders = {
      get: jest.fn().mockImplementation((header) => {
        if (header == "x-authUser") {
          return null;
        }
        if (header == "x-origin") {
          return "mockOrigin";
        }
        return null;
      }),
    };

    (cookies as jest.Mock).mockResolvedValue(mockCookies);
    (headers as jest.Mock).mockResolvedValue(mockHeaders);

    const props = { children: <div>Test</div> };
    const result = await Dashboard(props);

    expect(result.props.children).toBeDefined();
    // expect(
    //   result.props.children.props.children[0].props.children[0].props.children,
    // ).toContain("Login");
    // expect(
    //   result.props.children.props.children[0].props.children[1].props.children,
    // ).toContain("Register");
  });
});
