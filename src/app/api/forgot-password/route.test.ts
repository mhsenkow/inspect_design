/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "./route";
import { setPasswordResetKey } from "../password/functions";
import { UserLibSqlModel } from "../models/users";

jest.mock("../password/functions", () => ({
  setPasswordResetKey: jest.fn(),
}));

const mockQuery = {
  findOne: jest.fn(),
};

jest.mock("../models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn(() => mockQuery),
  },
}));

describe("POST /api/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserLibSqlModel.query as jest.Mock).mockReturnValue(mockQuery);
  });

  it("returns a generic message when the email is unknown", async () => {
    mockQuery.findOne.mockResolvedValue(undefined);
    const req = new NextRequest(
      new Request("http://localhost:3000/api/forgot-password", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: JSON.stringify({ email: "missing@example.com" }),
      }),
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/account exists/i);
    expect(body.resetUrl).toBeUndefined();
    expect(setPasswordResetKey).not.toHaveBeenCalled();
  });

  it("creates a reset key and exposes the local link in development", async () => {
    mockQuery.findOne.mockResolvedValue({
      id: 2,
      email: "bob@datagotchi.net",
    });
    (setPasswordResetKey as jest.Mock).mockResolvedValue({
      token: "reset-token-hex",
      payload: "reset-token-hex.9999999999999",
    });

    const req = new NextRequest(
      new Request("http://localhost:3000/api/forgot-password", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: JSON.stringify({ email: "Bob@Datagotchi.net" }),
      }),
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(setPasswordResetKey).toHaveBeenCalled();
    const body = await res.json();
    expect(body.resetPath).toBe(
      "/reset-password?token=reset-token-hex",
    );
    expect(body.resetUrl).toBe(
      "http://localhost:3000/reset-password?token=reset-token-hex",
    );
  });

  it("requires an email", async () => {
    const req = new NextRequest(
      new Request("http://localhost:3000/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "  " }),
      }),
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
