/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "./route";
import { InsightModel } from "../models/insights";
import { getAuthUser } from "../../functions";

jest.mock("../../functions");

jest.mock("../models/insights", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    withGraphJoined: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    // ...
    insertGraph: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    InsightModel: MockInsightModelConstructor,
  };
});

describe("/api/insights", () => {
  const mockInsights = [
    {
      id: 1,
      title: "Insight 1",
    },
    {
      id: 2,
      title: "Insight 2",
    },
  ];
  beforeEach(() => {
    const mockAuthUser = { user_id: 1, name: "Test User" };
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });
  describe("GET /api/insights", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (InsightModel.query().where as jest.Mock).mockReturnThis();
      (InsightModel.query().orderBy as jest.Mock).mockReturnThis();
      (InsightModel.query().clone as jest.Mock).mockReturnThis();
      (InsightModel.query().select as jest.Mock).mockReturnThis();
      (InsightModel.query().offset as jest.Mock).mockReturnThis();
      (InsightModel.query().limit as jest.Mock).mockReturnThis();
      (InsightModel.query().withGraphJoined as jest.Mock).mockReturnThis();
      (InsightModel.query().whereIn as jest.Mock).mockReturnThis();
      (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(
          callback(
            mockInsights.map((i) => ({
              ...i,
              children: [],
              parents: [],
              evidence: [],
            })),
          ),
        ),
      );
    });

    it("should return insights correctly with no query parameters", async () => {
      const searchParams = new URLSearchParams();
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      const response = await GET(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual(
        mockInsights.map((i) => ({
          ...i,
          parents: [],
          children: [],
          evidence: [],
        })),
      );

      expect(InsightModel.query().where as jest.Mock).toHaveBeenCalledWith(
        "insights.user_id",
        1,
      );
      expect(InsightModel.query().where as jest.Mock).toHaveBeenCalledWith(
        "insights.title",
        "ilike",
        "%%",
      );
      expect(
        InsightModel.query().withGraphJoined as jest.Mock,
      ).toHaveBeenCalled();
    });

    it("should return insights correctly with a 'query' query parameter", async () => {
      const searchParams = new URLSearchParams("query=insight%201");
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback(
              mockInsights.filter((i) =>
                i.title.toLowerCase().includes(searchParams.get("query")!),
              ),
            ),
          ),
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual([mockInsights[0]]);

      expect(InsightModel.query().where as jest.Mock).toHaveBeenCalledWith(
        "insights.title",
        "ilike",
        "%insight 1%",
      );
    });

    it("should return insights correctly with 'offset' and 'limit' query parameters across 2 page requests", async () => {
      // First page
      let searchParams = new URLSearchParams("offset=0&limit=1");
      let nextUrl = { searchParams };
      let req = { nextUrl } as NextRequest;

      const mockInsightsFirstPage = [mockInsights[0]];
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(mockInsightsFirstPage)),
      );

      let response = await GET(req);
      expect(response.status).toBe(200);

      let json = await response.json();
      expect(json).toEqual([mockInsights[0]]);

      expect(InsightModel.query().offset as jest.Mock).toHaveBeenCalledWith(0);
      expect(InsightModel.query().limit as jest.Mock).toHaveBeenCalledWith(1);

      // Second page
      searchParams = new URLSearchParams("offset=1&limit=1");
      nextUrl = { searchParams };
      req = { nextUrl } as NextRequest;

      const mockInsightsSecondPage = [mockInsights[1]];
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(mockInsightsSecondPage)),
      );

      response = await GET(req);
      expect(response.status).toBe(200);

      json = await response.json();
      expect(json).toEqual([mockInsights[1]]);

      expect(InsightModel.query().offset as jest.Mock).toHaveBeenCalledWith(1);
      expect(InsightModel.query().limit as jest.Mock).toHaveBeenCalledWith(1);
    });

    it("should return insights correctly with a 'parents' query parameter", async () => {
      const searchParams = new URLSearchParams("parents=true");
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback(
              mockInsights.map((i) => ({
                ...i,
                parents: [],
              })),
            ),
          ),
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json[0]).toHaveProperty("parents");
      expect(json[1]).toHaveProperty("parents");
    });

    it("should return insights correctly with a 'children' query parameter", async () => {
      const searchParams = new URLSearchParams("children=true");
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback(
              mockInsights.map((i) => ({
                ...i,
                children: [],
              })),
            ),
          ),
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json[0]).toHaveProperty("children");
      expect(json[1]).toHaveProperty("children");
    });

    it("should return insights correctly with a 'evidence' query parameter", async () => {
      const searchParams = new URLSearchParams("evidence=true");
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback(
              mockInsights.map((i) => ({
                ...i,
                evidence: [],
              })),
            ),
          ),
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json[0]).toHaveProperty("evidence");
      expect(json[1]).toHaveProperty("evidence");
    });

    it("should return http 401 when not logged in", async () => {
      (getAuthUser as jest.Mock).mockResolvedValue(null);

      const searchParams = new URLSearchParams();
      const nextUrl = { searchParams };
      const req = { nextUrl } as NextRequest;

      const response = await GET(req);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ statusText: "Unauthorized" });
    });
  });

  describe("POST /api/insights", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (InsightModel.query().insert as jest.Mock).mockReturnThis();
      (InsightModel.query().withGraphFetched as jest.Mock).mockReturnThis();
      (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(callback(mockInsights[0])),
      );
      (InsightModel.relatedQuery as jest.Mock).mockReturnThis();
      (InsightModel.query().findById as jest.Mock).mockReturnThis();
    });

    it("should return htttp 401 when user is not logged in", async () => {
      (getAuthUser as jest.Mock).mockResolvedValue(null);

      const req = {} as NextRequest;

      const response = await POST(req);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ statusText: "Unauthorized" });
    });

    it("should return http 400 when the title is missing", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const response = await POST(req);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "Creating a new insight requires at least a title",
      });
    });

    it("should successfully create and return an insight with the given title", async () => {
      const mockInsight = { id: 3, title: "New Insight" };
      const req = {
        json: jest.fn().mockResolvedValue({
          title: mockInsight.title,
        }),
      } as unknown as NextRequest;

      (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(callback(mockInsight)),
      );

      const response = await POST(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual(mockInsight);
      expect(InsightModel.query().insert).toHaveBeenCalledWith({
        title: "New Insight",
        user_id: 1,
        uid: expect.any(String),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    it("should handle database errors gracefully", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({
          title: "New Insight",
        }),
      } as unknown as NextRequest;

      // Mock database error
      (InsightModel.query().insert as jest.Mock).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await POST(req);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.statusText).toBe("Internal server error while creating insight");
    });

    it("should handle unique constraint violations", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({
          title: "New Insight",
        }),
      } as unknown as NextRequest;

      const uniqueError = new Error("Duplicate key");
      (uniqueError as any).code = '23505';
      (InsightModel.query().insert as jest.Mock).mockImplementation(() => {
        throw uniqueError;
      });

      const response = await POST(req);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.statusText).toBe("Internal server error while creating insight");
    });
  });
});
