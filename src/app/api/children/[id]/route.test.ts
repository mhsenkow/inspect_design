/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { DELETE } from "./route";
import { InsightLinkModel } from "../../models/insight_links";
import { getAuthUser } from "../../../functions";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));
jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("../../models/insight_links", () => {
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
    InsightLinkModel: MockInsightModelConstructor,
  };
});

describe("DELETE", () => {
  const mockReq = {} as NextRequest;
  const mockParentObject = { id: 1, user_id: 123 };
  // const mockLinkObject = { parent_id: 1, child_id: 2 };
  const mockChildObject = { id: 2, user_id: 123 };

  beforeEach(() => {
    jest.clearAllMocks();
    (InsightLinkModel.query().deleteById as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().where as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().whereIn as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().select as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().joinRelated as jest.Mock).mockReturnThis();
    (InsightLinkModel.query().then as jest.Mock).mockImplementation(
      (callback) =>
        Promise.resolve(
          callback(
            Number(
              mockChildObject.user_id == 123 && mockParentObject.user_id == 123,
            ),
          ),
        ),
    );
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

  it("returns 404 if it's someone else's child or parent insight instead of 403 for security reasons", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 456 });
    (InsightLinkModel.query().then as jest.Mock).mockReset();
    (InsightLinkModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(
          callback(
            Number(
              mockChildObject.user_id == 456 && mockParentObject.user_id == 456,
            ),
          ),
        ),
    );

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      statusText: "Child insight with specified id not found",
    });
  });

  it("returns 404 if child insight not found after trying to delete it", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });
    (InsightLinkModel.query().then as jest.Mock).mockReset();
    (InsightLinkModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(0)),
    );

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 3 }) });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      statusText: "Child insight with specified id not found",
    });
  });

  it("deletes child insight and returns success", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 123 });

    const res = await DELETE(mockReq, { params: Promise.resolve({ id: 1 }) });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ statusText: "success" });
    expect(InsightLinkModel.query().deleteById).toHaveBeenCalledTimes(1);
    expect(InsightLinkModel.query().whereIn).toHaveBeenCalledTimes(1);
    expect(InsightLinkModel.query().select).toHaveBeenCalledTimes(1);
    expect(InsightLinkModel.query().joinRelated).toHaveBeenCalledTimes(2);
    expect(InsightLinkModel.query().where).toHaveBeenCalledTimes(2);
    expect(InsightLinkModel.query().then).toHaveBeenCalledTimes(1);
  });
});
