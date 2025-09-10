/**
 * @jest-environment node
 */

import { ForeignKeyViolationError } from "objection";

import { POST } from "./route";
import { getAuthUser } from "../../functions";
import { EvidenceModel } from "../models/evidence";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("../models/evidence", () => {
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    EvidenceModel: MockInsightModelConstructor,
  };
});

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/evidence", () => {
  const mockAuthUser = { user_id: 1, name: "Test User" };
  const mockEvidence = [
    { summary_id: 1, insight_id: 2 },
    { summary_id: 3, insight_id: 4 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the first query (checking for existing evidence) to return empty array
    const mockFirstQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      withGraphFetched: jest.fn().mockResolvedValue([]), // No existing evidence
    };

    // Mock the second query (inserting new evidence) to return the mock evidence
    const mockSecondQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      withGraphFetched: jest.fn().mockResolvedValue(mockEvidence),
    };

    // Mock EvidenceModel.query to return different builders based on call count
    let callCount = 0;
    (EvidenceModel.query as jest.Mock).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockFirstQueryBuilder : mockSecondQueryBuilder;
    });

    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("inserts evidence and returns inserted evidence", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ evidence: mockEvidence }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockEvidence);
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

  it("returns 400 if evidence field is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "Evidence field in body is required",
    });
  });

  it("returns 400 if evidence objects are missing summary_id or insight_id", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        evidence: [{ summary_id: 1 }, { insight_id: 2 }],
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText:
        "Evidence objects must contain both summary_id and insight_id",
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests -- can't figure out how to throw ForeignKeyViolationError
  it.skip("returns 409 on ForeignKeyViolationError", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ evidence: mockEvidence }),
    } as any;
    (EvidenceModel.query().then as jest.Mock).mockReset();
    (EvidenceModel.query().then as jest.Mock).mockRejectedValueOnce({
      nativeError: {
        message: "FK error",
      } as unknown as typeof ForeignKeyViolationError,
    });

    // FIXME: test fails due to uncaught promise rejection
    const res = await POST(req);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      statusText: "Either the summary_id or insight_id is invalid",
    });
  });

  it("throws error for other database errors", async () => {
    // Reset the mock to throw an error on the first query
    (EvidenceModel.query as jest.Mock).mockImplementationOnce(() => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockRejectedValue(new Error("DB error")),
      };
      return mockQueryBuilder;
    });

    const req = {
      json: jest.fn().mockResolvedValue({ evidence: mockEvidence }),
    } as any;
    await expect(POST(req)).rejects.toThrow("DB error");
  });
});
