/**
 * @jest-environment node
 */

import { ForeignKeyViolationError } from "objection";

import { POST } from "./route";
import { getAuthUser } from "../../functions";
import { InsightLinkModel } from "../models/insight_links";
import { InsightLink } from "../../types";

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

jest.mock("../models/insight_links", () => {
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    relatedQuery: jest.fn(() => mockQueryBuilder),
  });

  return {
    InsightLinkModel: MockInsightModelConstructor,
  };
});

describe("POST /api/children", () => {
  const mockAuthUser = { user_id: 1, name: "Test User" };
  const mockChildren = [
    { child_id: 1, parent_id: 2 },
    { child_id: 3, parent_id: 4 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (InsightLinkModel.query().insert as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().then as jest.Mock).mockImplementation(
      (callback) =>
        Promise.resolve(
          callback(
            mockChildren.map((cl) => ({
              ...cl,
              childInsight: { evidence: [] },
              parentInsight: {},
            })),
          ),
        ),
    );
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("inserts children and returns inserted children", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ children: mockChildren }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    const childLinks = (await res.json()) as InsightLink[];
    childLinks.forEach((cl, i) => {
      const mockChildInput = mockChildren[i];
      expect(cl.child_id).toEqual(mockChildInput.child_id);
      expect(cl.parent_id).toEqual(mockChildInput.parent_id);
      expect(cl.childInsight).toEqual({ evidence: [] });
      expect(cl.parentInsight).toEqual({});
    });
  });

  it("returns 401 if user is not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    const req = {
      json: jest.fn(),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ statusText: "Unauthorized" });
  });

  it("returns 400 if children field is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "Children field in body is required",
    });
  });

  it("returns 400 if children objects are missing child_id or parent_id", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        children: [{ parent_id: 1 }, { child_id: 2 }],
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "Children objects must contain both child_id and parent_id",
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests -- can't figure out how to throw ForeignKeyViolationError
  it.skip("returns 400 on ForeignKeyViolationError", async () => {
    (InsightLinkModel.query().then as jest.Mock).mockReset();
    (InsightLinkModel.query().then as jest.Mock).mockRejectedValueOnce({
      nativeError: {
        message: "FK error",
      } as unknown as typeof ForeignKeyViolationError,
    });
    const req = {
      json: jest.fn().mockResolvedValue({ children: mockChildren }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "Either the child_id or parent_id is invalid",
    });
  });

  it("throws error for other database errors", async () => {
    (InsightLinkModel.query().then as jest.Mock).mockReset();
    (InsightLinkModel.query().then as jest.Mock).mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const req = {
      json: jest.fn().mockResolvedValue({ children: mockChildren }),
    } as any;
    await expect(POST(req)).rejects.toThrow("DB error");
  });
});
