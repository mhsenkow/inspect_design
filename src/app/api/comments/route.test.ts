/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { CommentModel } from "../models/comments";
import { POST } from "./route";
import { getAuthUser } from "../../functions";
import { ForeignKeyViolationError } from "objection";

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

const insertAndFetch = jest.fn();
const findById = jest.fn();
const withGraphFetched = jest.fn();

jest.mock("../models/comments", () => ({
  CommentModel: {
    query: jest.fn(() => ({
      insertAndFetch,
      findById,
      withGraphFetched,
    })),
  },
}));

describe("POST /api/comments", () => {
  const mockAuthUser = { id: 1, name: "Test User" };
  const mockComment = {
    id: 10,
    comment: "hi",
    user_id: 1,
    summary_id: 2,
    insight_id: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    insertAndFetch.mockResolvedValue(mockComment);
    findById.mockReturnValue({ withGraphFetched });
    withGraphFetched.mockResolvedValue(mockComment);
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a comment for an insight", async () => {
    const localMockComment = {
      ...mockComment,
      summary_id: undefined,
    };
    insertAndFetch.mockResolvedValueOnce(localMockComment);
    withGraphFetched.mockResolvedValueOnce(localMockComment);
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
    insertAndFetch.mockResolvedValueOnce(localMockComment);
    withGraphFetched.mockResolvedValueOnce(localMockComment);
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
    insertAndFetch.mockRejectedValueOnce(
      Object.assign(new ForeignKeyViolationError({} as any), {
        message: "FK error",
      }),
    );
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 1,
        summary_id: 2,
        comment: mockComment,
      }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      statusText: "Either the summary_id or insight_id is invalid",
    });
  });

  it("returns 500 JSON for other database errors", async () => {
    insertAndFetch.mockRejectedValueOnce(new Error("DB error"));
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 1,
        summary_id: 2,
        comment: mockComment,
      }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      message: "Unable to save comment.",
      statusText: "Unable to save comment.",
    });
  });
});
