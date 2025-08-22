/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { DELETE } from "./route";
import { EvidenceModel } from "../../models/evidence";
import { getAuthUser } from "../../../functions";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));
jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("../../models/evidence", () => {
  const mockQueryBuilder = {
    deleteById: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    joinRelated: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    relatedQuery: jest.fn(() => mockQueryBuilder),
  });

  return {
    EvidenceModel: MockInsightModelConstructor,
  };
});

describe("DELETE", () => {
  const mockReq = {} as NextRequest;
  // const mockEvidenceObject = { summary_id: 1, insight_id: 2 };
  // const mockSummaryObject = { id: 1 };
  const mockInsightObject = { id: 2, user_id: 123 };

  beforeEach(() => {
    jest.clearAllMocks();
    (EvidenceModel.query().deleteById as jest.Mock).mockReturnThis();
    (EvidenceModel.query().where as jest.Mock).mockReturnThis();
    (EvidenceModel.query().whereIn as jest.Mock).mockReturnThis();
    (EvidenceModel.query().select as jest.Mock).mockReturnThis();
    (EvidenceModel.query().joinRelated as jest.Mock).mockReturnThis();
    (EvidenceModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(1)),
    );
  });

  it("deletes evidence and returns success", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });
    (EvidenceModel.query().then as jest.Mock).mockReset();
    (EvidenceModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(callback(Number(mockInsightObject.user_id == 123))),
    );

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ statusText: "success" });
    expect(EvidenceModel.query().deleteById).toHaveBeenCalledTimes(1);
    expect(EvidenceModel.query().where).toHaveBeenCalledTimes(1);
    expect(EvidenceModel.query().then).toHaveBeenCalledTimes(1);
  });

  it("returns 401 if user is not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ statusText: "Unauthorized" });
  });

  it("returns 400 if id is missing", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });

    const res = await DELETE(mockReq, { params: Promise.resolve({}) as any });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "A valid id path parameter is required",
    });
  });

  it("returns 400 if id is not a number", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });

    const res = await DELETE(mockReq, {
      // @ts-expect-error -- invalid id is the point of this test
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      statusText: "A valid id path parameter is required",
    });
  });

  it("returns 404 if it's someone else's summary or insight instead of 403 for security reasons", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 456 });
    (EvidenceModel.query().then as jest.Mock).mockReset();
    (EvidenceModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(callback(Number(mockInsightObject.user_id == 456))),
    );

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      statusText: "Evidence to delete not found",
    });
  });

  it("returns 404 if evidence not found after trying to delete it", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });
    (EvidenceModel.query().then as jest.Mock).mockReset();
    (EvidenceModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(Number(0))),
    );

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      statusText: "Evidence to delete not found",
    });
  });
});
