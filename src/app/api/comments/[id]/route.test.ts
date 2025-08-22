/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { DELETE, DeleteCommentRouteProps } from "./route";
import { CommentModel } from "../../models/comments";
import { getAuthUser } from "../../../functions";
import { AuthUser } from "../../../types";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));
jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("../../models/comments", () => {
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
    CommentModel: MockInsightModelConstructor,
  };
});

describe("DELETE /api/comments/[id]", () => {
  let req: Pick<NextRequest, "json">;
  let props: DeleteCommentRouteProps;
  let authUser: AuthUser;
  const mockComment = { user_id: 123 };

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      json: jest.fn(),
    };
    props = {
      params: Promise.resolve({ id: 1 }),
    };
    authUser = { user_id: 123 };
    (getAuthUser as jest.Mock).mockResolvedValue(authUser);

    (CommentModel.query().deleteById as jest.Mock).mockReturnThis();
    (CommentModel.query().where as jest.Mock).mockReturnThis();
    (CommentModel.query().whereIn as jest.Mock).mockReturnThis();
    (CommentModel.query().select as jest.Mock).mockReturnThis();
    (CommentModel.query().joinRelated as jest.Mock).mockReturnThis();
    (CommentModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(
        callback(Number(authUser.user_id == mockComment.user_id)),
      ),
    );
  });

  it("should delete a comment and return success message", async () => {
    const response = await DELETE(req as NextRequest, props);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ statusText: "success" });
  });

  it("should return 401 if no logged-in user", async () => {
    (getAuthUser as jest.Mock).mockResolvedValueOnce(null);

    const response = await DELETE(req as NextRequest, props);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ statusText: "No logged-in user" });
    expect(response.status).toBe(401);
  });

  it("should return 404 if comment does not belong to user for security purposes", async () => {
    (getAuthUser as jest.Mock).mockResolvedValueOnce({ user_id: 456 });
    (CommentModel.query().then as jest.Mock).mockImplementationOnce(
      (callback) =>
        Promise.resolve(callback(Number(456 == mockComment.user_id))),
    );

    const response = await DELETE(req as NextRequest, props);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({ statusText: "Comment to delete not found" });
    expect(response.status).toBe(404);
  });
});
