/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { CommentModel } from "../models/comments";
import { POST } from "./route";
import { getAuthUser } from "../../functions";
import { ForeignKeyViolationError } from "objection";

jest.mock("../../functions");
jest.mock("../models/comments", () => {
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
    CommentModel: MockInsightModelConstructor,
  };
});

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/comments", () => {
  const mockAuthUser = { user_id: 1, name: "Test User" };
  const mockComment = {
    comment: "hi",
    user_id: 1,
    summary_id: 2,
    insight_id: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (CommentModel.query().insert as jest.Mock).mockReturnThis();
    (CommentModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (CommentModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockComment)),
    );
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a comment for an insight", async () => {
    const localMockComment = {
      ...mockComment,
      summary_id: undefined,
    };
    (CommentModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(localMockComment)),
    );
    const req = {
      json: jest.fn().mockResolvedValue(localMockComment),
    } as any;

    const response = await POST(req as NextRequest);

    const json = await response.json();
    expect(json).toEqual(localMockComment);
  });

  it("should create a comment for a summary", async () => {
    const localMockComment = {
      ...mockComment,
      insight_id: undefined,
    };
    (CommentModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(localMockComment)),
    );
    const req = {
      json: jest.fn().mockResolvedValue({
        summary_id: 1,
        comment: "asdf",
      }),
    } as any;

    const response = await POST(req as NextRequest);

    const json = await response.json();
    expect(json).toEqual(localMockComment);
  });

  it("should return 400 if neither insight_id nor summary_id is provided", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        comment: "asdf",
      }),
    } as any;

    const response = await POST(req as NextRequest);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.statusText).toEqual(
      "Request must include a valid comment and either insight_id or summary_id",
    );
  });

  it("should return 401 if user is not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    const req = {
      json: jest.fn().mockResolvedValue({
        comment: "asdf",
      }),
    } as any;

    const response = await POST(req as NextRequest);

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.statusText).toEqual("Unauthorized");
  });

  // eslint-disable-next-line jest/no-disabled-tests -- can't figure out how to throw ForeignKeyViolationError
  it.skip("returns 409 on ForeignKeyViolationError", async () => {
    (CommentModel.query().then as jest.Mock).mockReset();
    (CommentModel.query().then as jest.Mock).mockRejectedValueOnce({
      nativeError: {
        message: "FK error",
      } as unknown as typeof ForeignKeyViolationError,
    });
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 1,
        summary_id: 2,
        comment: mockComment,
      }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      statusText: "Either the summary_id or insight_id is invalid",
    });
  });

  it("throws error for other database errors", async () => {
    (CommentModel.query().then as jest.Mock).mockReset();
    (CommentModel.query().then as jest.Mock).mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 1,
        summary_id: 2,
        comment: mockComment,
      }),
    } as any;

    await expect(POST(req)).rejects.toThrow("DB error");
  });
});
