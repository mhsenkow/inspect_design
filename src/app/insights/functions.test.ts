import { getInsights } from "./functions";

global.fetch = jest.fn();
(global.fetch as jest.Mock).mockResolvedValue({
  status: 200,
  json: () => Promise.resolve([{ id: 1, name: "Test Insight" }]),
});

describe("getInsights", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("should fetch insights successfully", async () => {
    const origin = "http://example.com";
    const token = "test-token";

    const insights = await getInsights(origin, token);

    expect(fetch).toHaveBeenCalledWith(`${origin}/api/insights`, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    expect(insights).toEqual([{ id: 1, name: "Test Insight" }]);
  });

  it("should throw an error if the response status is not 200", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      json: () => Promise.resolve({ message: "Test" }),
    });

    const origin = "http://example.com";
    const token = "test-token";

    await expect(getInsights(origin, token)).rejects.toThrow("Test");
  });
});
