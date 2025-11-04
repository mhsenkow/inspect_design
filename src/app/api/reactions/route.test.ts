/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

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
    insert: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    then: jest.fn(),
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
  const mockAuthUser = { user_id: 1, name: "Test User" };
  const mockReaction = {
    reaction: "hi",
    user_id: 1,
    summary_id: 2,
    insight_id: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a chainable mock that properly handles delete().where()
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().insert as jest.Mock).mockReturnThis();
    (ReactionModel.query().onConflict as jest.Mock).mockReturnThis();
    (ReactionModel.query().merge as jest.Mock).mockReturnThis();
    (ReactionModel.query().where as jest.Mock).mockReturnThis();
    (ReactionModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockReaction)),
    );
    (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
  });

  it("should create a reaction for an insight", async () => {
    const localMockReaction = {
      ...mockReaction,
      summary_id: undefined,
    };
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(localMockReaction)),
    );
    const req = {
      json: jest.fn().mockResolvedValue(localMockReaction),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual(localMockReaction);
    expect(ReactionModel.query().insert as jest.Mock).toHaveBeenCalledWith(
      localMockReaction,
    );
  });

  it("should create a reaction for a summary", async () => {
    const localMockReaction = {
      ...mockReaction,
      insight_id: undefined,
    };
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) => Promise.resolve(callback(localMockReaction)),
    );
    const req = {
      json: jest.fn().mockResolvedValue(localMockReaction),
    } as any;

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual(localMockReaction);
    expect(ReactionModel.query().insert as jest.Mock).toHaveBeenCalledWith(
      localMockReaction,
    );
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
      "Request must include a valid reaction and either insight_id, summary_id, or comment_id",
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
    const error = new Error(errorMessage);
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().insert as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.statusText).toEqual(
      `Other database error: Error: ${errorMessage}`,
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
    const error = new Error(errorMessage);
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().insert as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.statusText).toEqual(
      `Other database error: Error: ${errorMessage}`,
    );
  });

  // TODO: get details from the caught error to return 404 instead of 500
  it("should return 500 if no user was found with the specified ID", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ user_id: 10 });
    const req = {
      json: jest.fn().mockResolvedValue({
        summary_id: 1,
        reaction: "🙂",
      }),
    } as any;
    const errorMessage =
      "23503: insert or update on table reactions violates foreign key constraint fk_u_id";
    const error = new Error(errorMessage);
    const mockDeleteBuilder = {
      where: jest.fn().mockResolvedValue(undefined),
    };
    (ReactionModel.query().delete as jest.Mock).mockReturnValue(
      mockDeleteBuilder,
    );
    (ReactionModel.query().insert as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    const response = await POST(req as NextRequest);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.statusText).toEqual(
      `Other database error: Error: ${errorMessage}`,
    );
  });
});
