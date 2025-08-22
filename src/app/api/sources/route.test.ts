/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { SourceModel } from "../models/sources";
import { POST } from "./route";
import { getAuthUser } from "../../functions";

jest.mock("../../functions");
jest.mock("../models/sources", () => {
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    SourceModel: MockInsightModelConstructor,
  };
});

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/comments", () => {
  const mockAuthUser = { user_id: 1, name: "Test User" };
  const mockSource = {
    baseurl: "test",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SourceModel.query().insert as jest.Mock).mockReturnThis();
    (SourceModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (SourceModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockSource)),
    );
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a source from a baseurl", async () => {
    const req = {
      json: jest.fn().mockResolvedValue(mockSource),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual(mockSource);
  });

  it("should return 500 upon error", async () => {
    const req = {
      json: jest.fn().mockResolvedValue(mockSource),
    } as any;
    (SourceModel.query().then as jest.Mock).mockImplementation(() => {
      throw new Error("DB error");
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.statusText).toEqual("Error: DB error");
  });
});
