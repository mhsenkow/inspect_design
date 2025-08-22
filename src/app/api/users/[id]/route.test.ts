/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { GET, DELETE } from "./route";
import { UserModel } from "../../models/users";
import { getAuthUser } from "../../../functions";

jest.mock("../../../functions");
jest.mock("../../models/users", () => {
  const mockQueryBuilder = {
    findById: jest.fn().mockReturnThis(),
    deleteById: jest.fn().mockReturnThis(),
    then: jest.fn(),
    catch: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    UserModel: MockInsightModelConstructor,
  };
});

describe("GET /api/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.query().findById as jest.Mock).mockReturnThis();
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback({})),
    );
  });
  it("should return user information if user exists", async () => {
    const mockUser = { id: 1, name: "John Doe", followers: [] };
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback(mockUser)),
    );

    const req = new NextRequest("http://localhost");
    const props = { params: Promise.resolve({ id: 1 }) };

    const response = await GET(req, props);
    const json = await response.json();

    expect(json).toEqual(mockUser);
    expect(response.status).toBe(200);
  });

  it("should return 404 if user does not exist", async () => {
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback(null)),
    );
    const req = new NextRequest("http://localhost");
    const props = { params: Promise.resolve({ id: 1 }) };

    const response = await GET(req, props);
    const json = await response.json();

    expect(json.message).toBe("User not found with ID: 1");
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.query().deleteById as jest.Mock).mockReturnThis();
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback({})),
    );
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 1 });
  });
  it("should delete user if authenticated user matches request user id", async () => {
    const req = new NextRequest("http://localhost");
    const props = { params: Promise.resolve({ id: 1 }) };

    const response = await DELETE(req, props);
    const json = await response.json();

    expect(json.statusText).toBe("success");
    expect(response.status).toBe(200);
  });

  it("should return 403 if authenticated user does not match request user id", async () => {
    const req = new NextRequest("http://localhost");
    const props = { params: Promise.resolve({ id: 2 }) };

    const response = await DELETE(req, props);
    const json = await response.json();

    expect(json.statusText).toBe("Forbidden");
    expect(response.status).toBe(403);
  });

  it("should return 401 if no authenticated user", async () => {
    (getAuthUser as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost");
    const props = { params: Promise.resolve({ id: 1 }) };

    const response = await DELETE(req, props);
    const json = await response.json();

    expect(json.statusText).toBe("Unauthorized");
    expect(response.status).toBe(401);
  });

  it("should return 500 if there is a server error", async () => {
    (UserModel.query().then as jest.Mock).mockReset();
    (UserModel.query().then as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Database error")),
    );
    const req = new NextRequest("http://localhost", {
      headers: {
        "x-authUser": JSON.stringify({ user_id: "1" }),
      },
    });
    const props = { params: Promise.resolve({ id: 1 }) };

    const response = await DELETE(req, props);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.statusText).toBe("Database error");
  });
});
