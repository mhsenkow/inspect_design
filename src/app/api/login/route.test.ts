/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { POST } from "./route";
import { createSession } from "../../../proxy/functions";
import { UserLibSqlModel } from "../models/users";

jest.mock("bcryptjs");
jest.mock("../../../proxy/functions");

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  then: jest.fn(),
};

jest.mock("../models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn(() => mockQueryBuilder),
  },
}));

describe("POST /api/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.then.mockImplementation((callback) =>
      Promise.resolve(callback([])),
    );
    (UserLibSqlModel.query as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  it("should return 200 and user data if credentials are correct", async () => {
    const localUser = {
      id: 1,
      username: "bob",
      email: "bobness@gmail.com",
      password: "W",
    };
    const token = "encryptedtoken";
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: localUser.email,
          password: localUser.password,
        }),
      }),
    );
    mockQueryBuilder.then.mockImplementationOnce((callback) =>
      Promise.resolve(callback([localUser])),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (createSession as jest.Mock).mockResolvedValue(token);

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(await res.json()).toEqual({
      id: localUser.id,
      username: localUser.username,
      email: localUser.email,
      token,
    });
  });

  it("should return 400 if email is missing", async () => {
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({ password: "asdf" }),
      }),
    );

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "All input is required" });
  });

  it("should return 400 if password is missing", async () => {
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      }),
    );

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "All input is required" });
  });

  it("should return 401 if password is incorrect", async () => {
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "bobness@gmail.com", password: "asdf" }),
      }),
    );
    mockQueryBuilder.then.mockImplementationOnce((callback) =>
      Promise.resolve(callback([{ id: 1, password: "hashedpassword" }])),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Invalid credentials" });
  });

  it("should return 404 if user does not exist", async () => {
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "asdf" }),
      }),
    );
    mockQueryBuilder.then.mockImplementationOnce((callback) =>
      Promise.resolve(callback([])),
    );

    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      message: "User does not exist. Please register.",
    });
  });
});
