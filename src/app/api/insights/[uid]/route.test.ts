/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import {
  GET,
  PATCH,
  DELETE,
  GetInsightRouteRequest,
  InsightRouteProps,
  PatchReq,
  PatchInsightRouteProps,
} from "./route";
import { getAuthUser } from "../../../functions";
import { InsightModel } from "../../models/insights";

// jest.mock("../../functions", () => ({
//   getUserData: jest.fn(),
// }));
jest.mock("../../../functions");
jest.mock("../../models/insights", () => {
  const mockQueryBuilder = {
    findOne: jest.fn().mockReturnThis(),
    for: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    withGraphJoined: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    whereInComposite: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    relatedQuery: jest.fn(() => mockQueryBuilder),
  });

  return {
    InsightModel: MockInsightModelConstructor,
  };
});

const mockInsightData = {
  uid: "123",
  title: "Test Insight",
};

describe("GET /api/insights/[uid]", () => {
  let props: InsightRouteProps;

  beforeEach(() => {
    jest.clearAllMocks();
    (InsightModel.query().findOne as jest.Mock).mockReturnThis();
    (InsightModel.query().for as jest.Mock).mockReturnThis();
    (InsightModel.query().patch as jest.Mock).mockReturnThis();
    (InsightModel.query().delete as jest.Mock).mockReturnThis();
    (InsightModel.query().insert as jest.Mock).mockReturnThis();
    (InsightModel.query().where as jest.Mock).mockReturnThis();
    (InsightModel.query().onConflict as jest.Mock).mockReturnThis();
    (InsightModel.query().merge as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (InsightModel.query().whereInComposite as jest.Mock).mockReturnThis();
    (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockInsightData)),
    );
    props = {
      params: Promise.resolve({ uid: "123" }),
    };
  });

  describe("Logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 1 });
    });

    it("should return insight data if found", async () => {
      // Mock
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "20",
          }),
        },
      } as GetInsightRouteRequest;

      // Act
      const response = await GET(req, props);
      expect(response.status).toBe(200);

      // Assert
      const json = await response.json();
      expect(json).toEqual(mockInsightData);
      expect(InsightModel.query().findOne).toHaveBeenCalledWith(
        "insights.uid",
        mockInsightData.uid,
      );
      expect(InsightModel.query().withGraphFetched).toHaveBeenCalledTimes(1);
    });

    it("should return evidence as summaries with reactions and comments", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "20",
          }),
        },
      } as GetInsightRouteRequest;
      (InsightModel.query().then as jest.Mock).mockReset();
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback({
              ...mockInsightData,
              evidence: [
                {
                  id: 1,
                  summary_id: 2,
                  title: "Summary Title",
                  updated_at: "2023-01-01",
                  url: "https://example.com",
                  imageUrl: "https://example.com/image.png",
                  logo_uri: "https://example.com/logo.png",
                  comments: [
                    {
                      comment: "hi",
                      id: 0,
                      user_id: 0,
                      // avatar_uri: "",
                    },
                  ],
                  reactions: [{ reaction: "bye" }],
                },
              ],
            }),
          ),
      );

      const response = await GET(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({
        ...mockInsightData,
        evidence: [
          {
            id: 1,
            summary_id: 2,
            comments: [
              { comment: "hi", /*avatar_uri: "",*/ id: 0, user_id: 0 },
            ],
            reactions: [{ reaction: "bye" }],
            title: "Summary Title",
            updated_at: "2023-01-01",
            imageUrl: "https://example.com/image.png",
            logo_uri: "https://example.com/logo.png",
            url: "https://example.com",
          },
        ],
      });
      expect(InsightModel.query().findOne).toHaveBeenCalledWith(
        "insights.uid",
        mockInsightData.uid,
      );
      expect(InsightModel.query().withGraphFetched).toHaveBeenCalledTimes(1);
    });

    it("should return the specified evidence length on first call", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "3",
          }),
        },
      } as GetInsightRouteRequest;
      (InsightModel.query().then as jest.Mock).mockReset();
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback({
              ...mockInsightData,
              evidence: [
                {
                  id: 1,
                  summary_id: 1,
                  title: "Summary Title 1",
                  updated_at: "2023-01-01",
                  comments: [],
                  reactions: [],
                },
                {
                  id: 2,
                  summary_id: 2,
                  title: "Summary Title 2",
                  updated_at: "2023-01-01",
                  comments: [],
                  reactions: [],
                },
                {
                  id: 3,
                  summary_id: 3,
                  title: "Summary Title 3",
                  updated_at: "2023-01-01",
                  comments: [],
                  reactions: [],
                },
              ],
            }),
          ),
      );

      const response = await GET(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.evidence.length).toBe(3);
      expect(json.evidence).toEqual([
        {
          id: 1,
          summary_id: 1,
          title: "Summary Title 1",
          updated_at: "2023-01-01",
          comments: [],
          reactions: [],
        },
        {
          id: 2,
          summary_id: 2,
          title: "Summary Title 2",
          updated_at: "2023-01-01",
          comments: [],
          reactions: [],
        },
        {
          id: 3,
          summary_id: 3,
          title: "Summary Title 3",
          updated_at: "2023-01-01",
          comments: [],
          reactions: [],
        },
      ]);
    });

    it("should return the next page of evidence on subsequent calls", async () => {
      (InsightModel.query().then as jest.Mock).mockReset();
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback({
              ...mockInsightData,
              evidence: [
                {
                  id: 4,
                  summary_id: 4,
                  title: "Summary Title 4",
                  updated_at: "2023-01-01",
                  comments: [],
                  reactions: [],
                },
                {
                  id: 5,
                  summary_id: 5,
                  title: "Summary Title 5",
                  updated_at: "2023-01-01",
                  comments: [],
                  reactions: [],
                },
              ],
            }),
          ),
      );
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "3",
            limit: "2",
          }),
        },
      } as GetInsightRouteRequest;

      const response = await GET(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.evidence.length).toBe(2);
      expect(json.evidence).toEqual([
        {
          id: 4,
          summary_id: 4,
          title: "Summary Title 4",
          updated_at: "2023-01-01",
          comments: [],
          reactions: [],
        },
        {
          id: 5,
          summary_id: 5,
          title: "Summary Title 5",
          updated_at: "2023-01-01",
          comments: [],
          reactions: [],
        },
      ]);
    });

    it("should return 404 if insight not found", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "2",
          }),
        },
      } as GetInsightRouteRequest;
      (InsightModel.query().then as jest.Mock).mockReset();
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(null)),
      );

      const response = await GET(req, props);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toEqual({ statusText: "No insight found with that uid" });
    });

    it("should return 400 if uid is missing", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "2",
          }),
        },
      } as GetInsightRouteRequest;

      props.params = Promise.resolve({});
      const response = await GET(req, props);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "A valid uid path parameter is required",
      });
    });

    it("should return 200/work if offset or limit are missing", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
          }),
        },
      } as GetInsightRouteRequest;

      const response = await GET(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual(mockInsightData);
    });
  });

  describe("Not logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue(null);
    });

    it("should return insight data if found (is_public)", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "2",
          }),
        },
      } as GetInsightRouteRequest;

      const response = await GET(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual(mockInsightData);
    });

    it("should return 404 if insight not found (!is_public)", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            offset: "0",
            limit: "2",
          }),
        },
      } as GetInsightRouteRequest;
      (InsightModel.query().then as jest.Mock).mockReset();
      (InsightModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(null)),
      );

      const response = await GET(req, props);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toEqual({ statusText: "No insight found with that uid" });
    });
  });
});

describe("PATCH /api/insights/[uid]", () => {
  let req: PatchReq;
  let props: PatchInsightRouteProps;

  beforeEach(() => {
    jest.clearAllMocks();
    (InsightModel.query().findOne as jest.Mock).mockReturnThis();
    (InsightModel.query().for as jest.Mock).mockReturnThis();
    (InsightModel.query().patch as jest.Mock).mockReturnThis();
    (InsightModel.query().delete as jest.Mock).mockReturnThis();
    (InsightModel.query().insert as jest.Mock).mockReturnThis();
    (InsightModel.query().where as jest.Mock).mockReturnThis();
    (InsightModel.query().onConflict as jest.Mock).mockReturnThis();
    (InsightModel.query().merge as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (InsightModel.query().whereInComposite as jest.Mock).mockReturnThis();
    (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockInsightData)),
    );
    req = {
      nextUrl: {
        searchParams: new URLSearchParams({ offset: "0" }),
      },
      json: jest.fn(),
    } as unknown as NextRequest;
    props = {
      params: Promise.resolve({ uid: "123" }),
    };
    (req.json as jest.Mock).mockResolvedValue({});
  });

  describe("Logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 1 });
    });

    it("should update all available insight fields", async () => {
      const putObject = {
        title: "New Title",
        is_public: true,
      };
      (req.json as jest.Mock).mockResolvedValue(putObject);

      const response = await PATCH(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({
        ...putObject,
        updated_at: expect.any(String),
      });

      expect(InsightModel.query().findOne).toHaveBeenCalledTimes(1);
      expect(InsightModel.query().patch).toHaveBeenCalledTimes(1);
    });

    it("should return 400 if title or is_public are missing", async () => {
      const response = await PATCH(req, props);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "New title or is_public are required",
      });
    });

    it("should return 400 if uid is missing", async () => {
      props.params = Promise.resolve({});
      const response = await PATCH(req, props);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "A valid uid path paramter is required",
      });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should return 403 if the logged-in user_id is not the owner of the insight", async () => {
      req.json = jest.fn().mockResolvedValue({
        title: "New Title",
        is_public: true,
      });
      // (InsightModel.query().then as jest.Mock).mockReset();
      // (InsightModel.query().then as jest.Mock).mockImplementationOnce(
      //   (callback) => Promise.resolve(callback(null)),
      // );

      const response = await PATCH(req, props);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "Insight with that uid not found",
      });
    });
  });

  describe("Not logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue(null);
    });

    it("should return 401", async () => {
      const response = await PATCH(req, props);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ statusText: "Unauthorized" });
    });
  });
});

describe("DELETE /api/insights/[uid]", () => {
  let req: NextRequest;
  let props: { params: Promise<{ uid?: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    (InsightModel.query().findOne as jest.Mock).mockReturnThis();
    (InsightModel.query().for as jest.Mock).mockReturnThis();
    (InsightModel.query().patch as jest.Mock).mockReturnThis();
    (InsightModel.query().delete as jest.Mock).mockReturnThis();
    (InsightModel.query().insert as jest.Mock).mockReturnThis();
    (InsightModel.query().where as jest.Mock).mockReturnThis();
    (InsightModel.query().onConflict as jest.Mock).mockReturnThis();
    (InsightModel.query().merge as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (InsightModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (InsightModel.query().whereInComposite as jest.Mock).mockReturnThis();
    (InsightModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockInsightData)),
    );
    req = {
      nextUrl: {
        searchParams: new URLSearchParams({ offset: "0" }),
      },
      json: jest.fn(),
    } as unknown as NextRequest;
    props = {
      params: Promise.resolve({ uid: "123" }),
    };
  });

  describe("Logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 1 });
    });

    it("should delete insight data", async () => {
      props = {
        params: Promise.resolve({ uid: "asdf" }) as Promise<{
          uid: string;
        }>,
      };
      const response = await DELETE(req, props);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({ statusText: "success" });
    });

    it("should return 400 if uid is missing or invalid", async () => {
      props.params = Promise.resolve({});
      const response = await DELETE(req, props);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        statusText: "A valid uid path parameter is required",
      });
    });
  });
  describe("Not logged in", () => {
    beforeEach(() => {
      (getAuthUser as jest.Mock).mockResolvedValue(null);
    });

    it("should return 401", async () => {
      props = {
        params: Promise.resolve({ uid: "[object object]" }) as Promise<{
          uid: string;
        }>,
      };
      const response = await DELETE(req, props);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ statusText: "Unauthorized" });
    });
  });
});
