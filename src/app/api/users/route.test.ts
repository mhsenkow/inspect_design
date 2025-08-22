/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { PATCH } from "./route";
import { getAuthUser } from "../../functions";
import { UserModel } from "../models/users";

jest.mock("../../functions");

jest.mock("../models/users", () => {
  const mockQueryBuilder = {
    patchAndFetchById: jest.fn().mockReturnThis(),
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

describe("PATCH /api/users", () => {
  const mockUser = { id: 1, email: "test@test.com" };
  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.query().patchAndFetchById as jest.Mock).mockReturnThis();
    (UserModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockUser)),
    );
  });

  it("should update user information if authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 1 });
    const req = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ email: "newemail@example.com" }),
    });
    const newMockUser = {
      ...mockUser,
      email: "newemail@example.com",
    };
    (UserModel.query().then as jest.Mock).mockImplementationOnce((callback) =>
      Promise.resolve(callback(newMockUser)),
    );

    const response = await PATCH(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual(newMockUser);
  });

  it("should return 401 if not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ email: "newemail@example.com" }),
    });

    const response = await PATCH(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.statusText).toBe("Unauthorized");
  });
});
