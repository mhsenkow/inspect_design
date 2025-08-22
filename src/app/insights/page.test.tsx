/**
 * @jest-environment node
 */
import InsightsPage from "./page";
import { getInsights } from "./functions";
import { getUserFromServer } from "../api/functions";

jest.mock("./functions", () => ({
  getInsights: jest.fn(),
}));

jest.mock("../api/functions", () => ({
  getUserFromServer: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

describe("InsightsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the data before returning a client-side component", async () => {
    const mockUser = { id: 1, name: "Test User" };
    const mockInsights = [{ id: 1, title: "Test Insight" }];

    (getUserFromServer as jest.Mock).mockResolvedValue(mockUser);
    (getInsights as jest.Mock).mockResolvedValue(mockInsights);

    const mockHeaders = {
      get: jest.fn().mockImplementation((header) => {
        if (header == "x-origin") return "test-origin";
        if (header == "x-authUser")
          return JSON.stringify({ user_id: mockUser.id });
      }),
    };

    const mockCookies = {
      get: jest.fn().mockImplementation((cookie) => {
        if (cookie == "token") return { value: "test-token" };
      }),
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("next/headers").headers.mockReturnValue(mockHeaders);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("next/headers").cookies.mockReturnValue(mockCookies);

    await InsightsPage();

    expect(getUserFromServer).toHaveBeenCalledWith(
      "test-origin",
      { id: mockUser.id },
      mockCookies.get("token").value,
    );
    expect(getInsights).toHaveBeenCalledWith(
      "test-origin",
      "test-token",
      expect.any(URLSearchParams),
    );
  });
});
