/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { DELETE, DeleteSessionRouteProps } from "./[email]/route";
import { UserLibSqlModel } from "../models/users";

// Mock the UserLibSqlModel from the database layer
jest.mock("../models/users", () => ({
  UserLibSqlModel: {
    query: jest.fn().mockReturnThis(), // Return a stable 'this' context
  },
}));

describe("DELETE /api/logout", () => {
  // Mock the chained query builder methods
  const mockWhereToken = jest.fn();
  const mockWhereEmail = jest.fn().mockReturnValue({ where: mockWhereToken });
  const mockDelete = jest.fn().mockReturnValue({ where: mockWhereEmail });

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();
    // Now, tell the stable mock what .delete() should do for each test
    (UserLibSqlModel.query as jest.Mock).mockReturnValue({
      delete: mockDelete,
    });
  });

  it("should successfully log out and return 204", async () => {
    const email = "test@example.com";
    const token = "valid-token-123";

    // Simulate one row being deleted
    mockWhereToken.mockResolvedValue(1);

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
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockWhereEmail).toHaveBeenCalledWith("email", email);
    expect(mockWhereToken).toHaveBeenCalledWith("token", token);

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
    const dbError = new Error("Database connection failed");

    // Simulate a database error
    mockWhereToken.mockRejectedValue(dbError);

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
