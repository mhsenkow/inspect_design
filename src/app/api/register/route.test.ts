/**
 * @jest-environment node
 */
import bcrypt from "bcryptjs";

import { POST } from "./route";
import { getEncryptedToken } from "../../../middleware/functions";
import { NextRequest } from "next/server";
import { UserModel } from "../models/users";
import { UniqueViolationError } from "objection";

jest.mock("bcryptjs");
jest.mock("../functions");
jest.mock("../../../middleware/functions");

jest.mock("../models/users", () => {
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    UserModel: MockInsightModelConstructor,
  };
});

describe("POST /register", () => {
  let req: Pick<NextRequest, "json">;

  beforeEach(() => {
    req = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
    (UserModel.query().where as jest.Mock).mockReturnThis();
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback({})),
    );
  });

  it("should create a new user and return 201", async () => {
    const localUser = {
      id: 1,
      username: "test",
      email: "test@test.com",
      password: "password",
    };
    const encryptedPassword = "encryptedPassword";
    const token = "token";

    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
      enable_email_notifications: true,
    });
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(localUser)),
    );
    (bcrypt.hash as jest.Mock).mockResolvedValue(encryptedPassword);
    (getEncryptedToken as jest.Mock).mockReturnValue(token);

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json).toEqual({ ...localUser, token });
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

  // eslint-disable-next-line jest/no-disabled-tests -- FIXME: throwing a UniqueViolationError is hard
  it.skip("should return 401 if user already exists", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
    });
    (UserModel.query().where as jest.Mock).mockImplementationOnce(() => {
      throw new UniqueViolationError("Database error");
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json).toEqual({
      message: "User Already Exists. Please Login",
    });
  });

  it("should return 500 if another db error is thrown", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      username: "test",
      email: "test@test.com",
      password: "password",
    });

    (UserModel.query().where as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Database error");
    });

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
