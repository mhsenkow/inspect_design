/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "./route";
import {
  clearSessionsForUser,
  getPasswordResetKey,
  hashPassword,
  isResetPayloadValid,
  updateUserPassword,
} from "../password/functions";
import { UserLibSqlModel } from "../models/users";

jest.mock("../password/functions", () => ({
  clearSessionsForUser: jest.fn(),
  getPasswordResetKey: jest.fn(),
  hashPassword: jest.fn(),
  isResetPayloadValid: jest.fn(),
  updateUserPassword: jest.fn(),
}));

const mockQuery = {
  whereNotNull: jest.fn(),
};

jest.mock("../models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn(() => mockQuery),
  },
}));

describe("POST /api/reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserLibSqlModel.query as jest.Mock).mockReturnValue(mockQuery);
  });

  it("rejects missing token or password", async () => {
    const req = new NextRequest(
      new Request("http://localhost:3000/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "", password: "abcdef" }),
      }),
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects short passwords", async () => {
    const req = new NextRequest(
      new Request("http://localhost:3000/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "abc", password: "123" }),
      }),
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "Password must be at least 6 characters",
    });
  });

  it("rejects invalid tokens", async () => {
    mockQuery.whereNotNull.mockResolvedValue([
      { id: 2, passwordResetKey: "stored" },
    ]);
    (getPasswordResetKey as jest.Mock).mockReturnValue("stored");
    (isResetPayloadValid as jest.Mock).mockReturnValue(false);

    const req = new NextRequest(
      new Request("http://localhost:3000/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "bad", password: "abcdef" }),
      }),
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("updates the password, clears sessions, and expires the auth cookie", async () => {
    mockQuery.whereNotNull.mockResolvedValue([
      { id: 2, passwordResetKey: "stored.payload" },
    ]);
    (getPasswordResetKey as jest.Mock).mockReturnValue("stored.payload");
    (isResetPayloadValid as jest.Mock).mockReturnValue(true);
    (hashPassword as jest.Mock).mockResolvedValue("hashed");
    (updateUserPassword as jest.Mock).mockResolvedValue(undefined);
    (clearSessionsForUser as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest(
      new Request("http://localhost:3000/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "good-token", password: "newpass99" }),
      }),
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockQuery.whereNotNull).toHaveBeenCalledWith("password_reset_key");
    expect(hashPassword).toHaveBeenCalledWith("newpass99");
    expect(updateUserPassword).toHaveBeenCalledWith(2, "hashed");
    expect(clearSessionsForUser).toHaveBeenCalledWith(2);

    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie.toLowerCase()).toContain("token=");
    expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=/i);
  });
});
