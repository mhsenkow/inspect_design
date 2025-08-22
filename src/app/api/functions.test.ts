/**
 * @jest-environment node
 */

import {
  getUserFromServer,
  getInsightFromServer,
  getLinkFromServer,
} from "./functions";

describe("functions", () => {
  const mockFetchJsonResponse = jest.fn();
  global.fetch = jest.fn();
  (global.fetch as jest.Mock).mockResolvedValue({
    status: 200,
    json: mockFetchJsonResponse,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getUserFromServer should fetch user data from the server", async () => {
    const origin = "http://localhost";
    const authUser = { user_id: 1 };
    const mockResponse = { id: 1, name: "John Doe" };
    mockFetchJsonResponse.mockResolvedValue(mockResponse);

    const result = await getUserFromServer(
      origin,
      { id: authUser.user_id },
      "mockToken",
    );
    expect(fetch).toHaveBeenCalledWith(`${origin}/api/users/1`, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": "mockToken",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getInsightFromServer should fetch insight data from the server", async () => {
    const origin = "http://localhost";
    const uid = "insight-uid";
    const token = "mockToken";
    const mockResponse = { id: 1, title: "Insight Title" };
    mockFetchJsonResponse.mockResolvedValue(mockResponse);

    const result = await getInsightFromServer(origin, { uid }, token);
    expect(fetch).toHaveBeenCalledWith(`${origin}/api/insights/${uid}`, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getLinkFromServer should fetch link data from the server", async () => {
    const origin = "http://localhost";
    const uid = "link-uid";
    const mockResponse = { id: 1, url: "http://example.com" };
    mockFetchJsonResponse.mockResolvedValue(mockResponse);

    const result = await getLinkFromServer(origin, uid);
    expect(fetch).toHaveBeenCalledWith(`${origin}/api/links/${uid}`);
    expect(result).toEqual(mockResponse);
  });
});
