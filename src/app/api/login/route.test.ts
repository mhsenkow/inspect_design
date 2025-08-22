/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { POST } from "./route";
import { getEncryptedToken } from "../../../middleware/functions";
import { UserModel } from "../models/users";

jest.mock("bcryptjs");
jest.mock("../../../middleware/functions");

jest.mock("../models/users", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
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

describe("POST /login", () => {
  const mockUser = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.query().where as jest.Mock).mockReturnThis();
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockUser)),
    );
  });

  it("should return 200 and user data if credentials are correct", async () => {
    const localUser = {
      id: 1,
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
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback([localUser])),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (getEncryptedToken as jest.Mock).mockReturnValue(token);

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(await res.json()).toEqual({
      ...localUser,
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
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback([{ id: 1, password: "hashedpassword" }])),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Invalid Credentials" });
  });

  it("should return 404 if user does not exist", async () => {
    const req = new NextRequest(
      new Request("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "asdf" }),
      }),
    );
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback([])),
    );

    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      message: "User does not Exist. Please register",
    });
  });
});
