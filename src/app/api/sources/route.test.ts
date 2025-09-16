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

  it("should return 400 if baseUrl is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toBe("baseUrl is required");
  });

  it("should return 400 if baseUrl format is invalid", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ baseUrl: "invalid-url" }),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toBe("Invalid baseUrl format");
  });

  it("should return existing source if baseUrl already exists", async () => {
    const existingSource = {
      id: 1,
      baseurl: "example.com",
      logo_uri: null,
    };

    // Mock the query to return existing source
    (SourceModel.query().where as jest.Mock).mockReturnThis();
    (SourceModel.query().first as jest.Mock).mockResolvedValue(existingSource);

    const req = {
      json: jest.fn().mockResolvedValue({ baseUrl: "example.com" }),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(existingSource);

    // Should not call insert since source already exists
    expect(SourceModel.query().insert).not.toHaveBeenCalled();
  });

  it("should handle unique constraint violations", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ baseUrl: "example.com" }),
    } as any;

    const uniqueError = new Error("Duplicate key");
    (uniqueError as any).code = "23505";
    (SourceModel.query().insert as jest.Mock).mockImplementation(() => {
      throw uniqueError;
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.message).toBe("Source already exists");
  });

  it("should return 500 upon general database error", async () => {
    const req = {
      json: jest.fn().mockResolvedValue(mockSource),
    } as any;
    (SourceModel.query().insert as jest.Mock).mockImplementation(() => {
      throw new Error("DB error");
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.message).toBe("Failed to create source");
  });
});
