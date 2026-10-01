/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { ForeignKeyViolationError } from "objection";

import { ReactionModel } from "../models/reactions";
import { POST } from "./route";
import { getAuthUser } from "../../functions";

jest.mock("../functions");
jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("../../functions", () => ({
  getAuthUser: jest.fn(),
}));

jest.mock("../models/reactions", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    first: jest.fn(),
    patchAndFetchById: jest.fn(),
    insertAndFetch: jest.fn(),
  };

  const MockInsightModelConstructor = jest.fn();
  Object.assign(MockInsightModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    ReactionModel: MockInsightModelConstructor,
  };
});

describe("POST /api/reactions", () => {
  const mockAuthUser = { id: 1, name: "Test User" };
  const mockReaction = {
    id: 10,
    reaction: "hi",
    user_id: 1,
    summary_id: 2,
    insight_id: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ReactionModel.query().where as jest.Mock).mockReturnThis();
    (ReactionModel.query().whereNull as jest.Mock).mockReturnThis();
    (ReactionModel.query().first as jest.Mock).mockResolvedValue(undefined);
    (ReactionModel.query().insertAndFetch as jest.Mock).mockResolvedValue(
      mockReaction,
    );
    (ReactionModel.query().patchAndFetchById as jest.Mock).mockResolvedValue(
      mockReaction,
    );
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a reaction for an insight", async () => {
    const localMockReaction = {
      ...mockReaction,
      summary_id: undefined,
    };
    (ReactionModel.query().insertAndFetch as jest.Mock).mockResolvedValueOnce(
      localMockReaction,
    );
    const req = {
      json: jest.fn().mockResolvedValue(localMockReaction),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual(localMockReaction);
    expect(
      ReactionModel.query().insertAndFetch as jest.Mock,
    ).toHaveBeenCalledWith({
      insight_id: 3,
      summary_id: undefined,
      reaction: "hi",
      user_id: 1,
    });
  });

  it("should create a reaction for a summary", async () => {
    const localMockReaction = {
      ...mockReaction,
      insight_id: undefined,
    };
    (ReactionModel.query().insertAndFetch as jest.Mock).mockResolvedValueOnce(
      localMockReaction,
    );
    const req = {
      json: jest.fn().mockResolvedValue(localMockReaction),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual(localMockReaction);
    expect(
      ReactionModel.query().insertAndFetch as jest.Mock,
    ).toHaveBeenCalledWith({
      insight_id: undefined,
      summary_id: 2,
      reaction: "hi",
      user_id: 1,
    });
  });

  it("should update an existing reaction", async () => {
    (ReactionModel.query().first as jest.Mock).mockResolvedValueOnce({
      id: 10,
    });
    const updatedReaction = { ...mockReaction, reaction: "updated" };
    (
      ReactionModel.query().patchAndFetchById as jest.Mock
    ).mockResolvedValueOnce(updatedReaction);
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 3,
        reaction: "updated",
      }),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updatedReaction);
    expect(
      ReactionModel.query().patchAndFetchById as jest.Mock,
    ).toHaveBeenCalledWith(10, { reaction: "updated" });
  });

  it("should return 400 if neither insight_id nor summary_id is provided", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        reaction: "🙂",
      }),
    } as any;

    const response = await POST(req as NextRequest);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.statusText).toEqual(
      "Request must include a valid reaction and either insight_id or summary_id",
    );
  });

  it("should return 401 if user is not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    const req = {
      json: jest.fn().mockResolvedValue({
        reaction: "🙂",
      }),
    } as any;

    const response = await POST(req as NextRequest);

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.statusText).toEqual("Unauthorized");
  });

  // TODO: get details from the caught error to return 404 instead of 500
  it("should return 500 if no insight was found with the specified ID", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        insight_id: 1,
        reaction: "🙂",
      }),
    } as any;
    const errorMessage =
      "23503: insert or update on table reactions violates foreign key constraint fk_i_id";
    const error = Object.create(ForeignKeyViolationError.prototype);
    error.message = errorMessage;
    (ReactionModel.query().insertAndFetch as jest.Mock).mockRejectedValueOnce(
      error,
    );

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(409);

    const json = await response.json();
    expect(json.statusText).toEqual(
      "Either the summary_id or insight_id is invalid",
    );
  });

  // TODO: get details from the caught error to return 404 instead of 500
  it("should return 500 if no summary was found with the specified ID", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        summary_id: 1,
        reaction: "🙂",
      }),
    } as any;
    const errorMessage =
      "23503: insert or update on table reactions violates foreign key constraint fk_s_id";
    const error = Object.create(ForeignKeyViolationError.prototype);
    error.message = errorMessage;
    (ReactionModel.query().insertAndFetch as jest.Mock).mockRejectedValueOnce(
      error,
    );

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(409);

    const json = await response.json();
    expect(json.statusText).toEqual(
      "Either the summary_id or insight_id is invalid",
    );
  });

  // TODO: get details from the caught error to return 404 instead of 500
  it("should return 500 if no user was found with the specified ID", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 10 });
    const req = {
      json: jest.fn().mockResolvedValue({
        summary_id: 1,
        reaction: "🙂",
      }),
    } as any;
    const errorMessage =
      "23503: insert or update on table reactions violates foreign key constraint fk_u_id";
    const error = new Error(errorMessage);
    (ReactionModel.query().insertAndFetch as jest.Mock).mockRejectedValueOnce(
      error,
    );

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.statusText).toEqual("Unable to save reaction.");
  });
});
