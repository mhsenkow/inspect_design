/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { DELETE, DeleteSessionRouteProps } from "./route";
import { UserLibSqlModel } from "@/app/api/models/users";

// Mock the UserLibSqlModel from the database layer
jest.mock("@/app/api/models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn(),
  },
}));

describe("DELETE /api/logout", () => {
  const mockQueryBuilder = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };
  const mockReturnThisOnce = function () {
    return mockQueryBuilder;
  };

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();

    // Set up the mock implementation for the UserModel query.
    // This ensures that for every test, UserModel.query() returns
    // a mock query builder that can be chained.
    (UserLibSqlModel.query as jest.Mock).mockReturnValue(mockQueryBuilder);
    // Mock the final step of the chain to resolve the promise
    // (mockQueryBuilder.where as jest.Mock).mockResolvedValueOnce(1);
  });

  it("should successfully log out and return 204", async () => {
    // The call chain is .delete().where().where(). The final .where() resolves.
    (mockQueryBuilder.delete as jest.Mock).mockImplementation(
      mockReturnThisOnce,
    );
    (mockQueryBuilder.where as jest.Mock).mockImplementationOnce(
      mockReturnThisOnce,
    );
    (mockQueryBuilder.where as jest.Mock).mockResolvedValueOnce(1);
    const email = "test@example.com";
    const token = "valid-token-123";

    const req = new NextRequest("http://localhost/api/logout", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    // Verify that the database query was constructed and called correctly
    expect(UserLibSqlModel.query).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.delete).toHaveBeenCalledTimes(1); // Called first
    expect(mockQueryBuilder.where).toHaveBeenNthCalledWith(1, "email", email); // Then where
    expect(mockQueryBuilder.where).toHaveBeenNthCalledWith(2, "token", token);

    // Verify the response
    expect(response.status).toBe(204);
    expect(response.statusText).toBe("Successfully logged out");
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const email = "test@example.com";

    const req = new NextRequest("http://localhost/api/logout", {
      headers: {}, // No authorization header
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    // Ensure no database call was made
    expect(UserLibSqlModel.query).not.toHaveBeenCalled();

    // Verify the response
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.statusText).toBe("Unauthorized");
  });

  it("should return 500 if the database query fails", async () => {
    const email = "test@example.com";
    const token = "valid-token-123";
    const dbError = new Error("DB connection failed");

    // Simulate a database error by having the final call in the chain reject.
    // The call chain is .delete().where().where()
    (mockQueryBuilder.delete as jest.Mock).mockImplementation(
      mockReturnThisOnce,
    );
    (mockQueryBuilder.where as jest.Mock).mockImplementationOnce(
      mockReturnThisOnce,
    );
    (mockQueryBuilder.where as jest.Mock).mockRejectedValue(dbError);

    const req = new NextRequest("http://localhost/api/logout", {
      headers: { authorization: `Bearer ${token}` },
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.statusText).toBe("Internal server error while logging out");
  });
});
