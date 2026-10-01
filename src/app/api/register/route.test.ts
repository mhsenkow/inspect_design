/**
 * @jest-environment node
 */
import bcrypt from "bcryptjs";

import { POST } from "./route";
import { createSession } from "../../../proxy/functions";
import { NextRequest } from "next/server";

jest.mock("bcryptjs");
jest.mock("../../../proxy/functions");

const mockSqliteQuery = {
  insert: jest.fn(),
  findOne: jest.fn(),
  deleteById: jest.fn(),
  max: jest.fn().mockReturnThis(),
  first: jest.fn(),
};

const mockPostgresQuery = {
  insert: jest.fn(),
  max: jest.fn().mockReturnThis(),
  first: jest.fn(),
};

jest.mock("../models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn(() => mockSqliteQuery),
  },
  UserPostgresModel: {
    query: jest.fn(() => mockPostgresQuery),
  },
}));

describe("POST /register", () => {
  let req: Pick<NextRequest, "json">;

  beforeEach(() => {
    req = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
    mockSqliteQuery.findOne.mockResolvedValue(undefined);
    mockSqliteQuery.max.mockReturnThis();
    mockSqliteQuery.first.mockResolvedValue({ maxId: 0 });
    mockSqliteQuery.insert.mockResolvedValue({
      id: 1,
      username: "test",
      email: "test@test.com",
      password: "encryptedPassword",
    });
    mockSqliteQuery.deleteById.mockResolvedValue(1);
    mockPostgresQuery.max.mockReturnThis();
    mockPostgresQuery.first.mockResolvedValue({ maxId: 0 });
    mockPostgresQuery.insert.mockResolvedValue({});
  });

  it("should create a new user and return 201", async () => {
    const token = "token";

    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
      enable_email_notifications: true,
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("encryptedPassword");
    (createSession as jest.Mock).mockResolvedValue(token);

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json).toEqual({
      id: 1,
      username: "test",
      email: "test@test.com",
      token,
      enable_email_notifications: false,
    });
    expect(mockPostgresQuery.insert).toHaveBeenCalledWith({
      id: 1,
      username: "test",
      email: "test@test.com",
      password: "encryptedPassword",
    });
  });

  it("should return 400 if input is missing", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "",
      email: "",
      password: "",
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ message: "All input is required" });
  });

  it("should return 409 if user already exists", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
    });
    mockSqliteQuery.findOne.mockResolvedValueOnce({
      id: 9,
      email: "test@test.com",
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(409);

    const json = await response.json();
    expect(json).toEqual({
      message: "User already exists. Please login or reset your password.",
    });
  });

  it("should return 500 if another db error is thrown", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("encryptedPassword");
    mockSqliteQuery.insert.mockRejectedValueOnce(new Error("Database error"));

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      message: "An unexpected error occurred during registration.",
    });
  });

  it("should handle errors gracefully on await req.json()", async () => {
    (req.json as jest.Mock).mockRejectedValue(new Error("Test error"));

    await expect(POST(req as NextRequest)).rejects.toThrow("Test error");
  });
});
