/**
 * @jest-environment node
 */

import { encodeStringURI } from "../../hooks/functions";
import { GET, GetLinksRequest, POST } from "./route";
import { NextRequest } from "next/server";
import { SummaryModel } from "../models/summaries";
import { getAuthUser } from "../../functions";

jest.mock("../../functions");

jest.mock("../models/summaries", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    withGraphJoined: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    page: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    then: jest.fn(),
  };

  const MockSummaryModelConstructor = jest.fn();
  Object.assign(MockSummaryModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    SummaryModel: MockSummaryModelConstructor,
  };
});

const mockSummaries = [
  { id: 1, title: "Summary 1" },
  { id: 2, title: "Summary 2" },
];

describe("GET /api/links", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SummaryModel.query().where as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (SummaryModel.query().orderBy as jest.Mock).mockReturnThis();
    (SummaryModel.query().page as jest.Mock).mockReturnThis();
    (SummaryModel.query().insert as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (SummaryModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(
        callback({
          results: mockSummaries,
        }),
      ),
    );
    const mockAuthUser = { user_id: 1, name: "Test User" };
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should return a list of summaries", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ offset: "0", limit: "2" }),
      },
    } as GetLinksRequest;

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual(mockSummaries);
  });

  it("should handle query parameters", async () => {
    const localMockSummaries = [mockSummaries[0]];
    (SummaryModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(
          callback({
            results: localMockSummaries,
          }),
        ),
    );
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({
          query: encodeStringURI("Summary 1"),
          offset: "0",
          limit: "1",
        }),
      },
    } as GetLinksRequest;

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual(localMockSummaries);
  });
});

describe("POST /api/links", () => {
  const mockSummary = mockSummaries[0];

  beforeEach(() => {
    jest.clearAllMocks();
    (SummaryModel.query().where as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (SummaryModel.query().orderBy as jest.Mock).mockReturnThis();
    (SummaryModel.query().page as jest.Mock).mockReturnThis();
    (SummaryModel.query().insert as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (SummaryModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockSummary)),
    );
    const mockAuthUser = { user_id: 1, name: "Test User" };
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a new summary", async () => {
    const localMockSummary = {
      url: "http://example.com",
      title: "New Summary",
      source_id: 1,
    };

    (SummaryModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(
          callback({
            ...localMockSummary,
            id: 1,
          }),
        ),
    );
    const req = {
      json: jest.fn().mockResolvedValue({
        url: "http://example.com",
        source_id: 1,
        title: "New Summary",
      }),
    } as unknown as NextRequest;

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ...localMockSummary,
      id: 1,
    });
  });

  it("should return 400 if required fields are missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        url: "http://example.com",
      }),
    } as unknown as NextRequest;

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({
      message: "Invalid request: url, source_id, and title are required",
    });
  });

  it("should return existing summary if URL already exists", async () => {
    const existingSummary = {
      id: 1,
      url: "http://example.com",
      title: "Existing Summary",
      source_id: 1,
    };

    // Mock the query to return existing summary
    (SummaryModel.query().where as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (SummaryModel.query().first as jest.Mock).mockResolvedValue(
      existingSummary,
    );

    const req = {
      json: jest.fn().mockResolvedValue({
        url: "http://example.com",
        source_id: 1,
        title: "New Summary",
      }),
    } as unknown as NextRequest;

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(existingSummary);

    // Should not call insert since summary already exists
    expect(SummaryModel.query().insert).not.toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        url: "http://example.com",
        source_id: 1,
        title: "New Summary",
      }),
    } as unknown as NextRequest;

    // Mock database error
    (SummaryModel.query().where as jest.Mock).mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Internal server error while creating link");
  });
});
