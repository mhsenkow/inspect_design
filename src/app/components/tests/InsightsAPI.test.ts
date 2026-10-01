import { Insight } from "../../types";
import {
  createInsights,
  deleteInsights,
  modifyInsight,
  publishInsights,
} from "../InsightsAPI";

describe("InsightsAPI", () => {
  const token = "test-token";
  const mockInsight = { uid: "123", title: "Test insight" } as Insight;
  const mockFetchResponseJson = jest.fn();
  window.fetch = jest.fn();

  beforeEach(() => {
    (window.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: mockFetchResponseJson,
      text: async () => JSON.stringify(await mockFetchResponseJson()),
    });
  });

  it("createInsight should create an insight", async () => {
    mockFetchResponseJson.mockResolvedValue({
      ...mockInsight,
      comments: [],
      reactions: [],
    });

    const response = await createInsights({ insights: [mockInsight] }, token);

    expect(fetch).toHaveBeenCalledWith("/api/insights", {
      method: "POST",
      body: JSON.stringify(mockInsight),
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });

    expect(response).toEqual([
      {
        action: 1,
        facts: [{ ...mockInsight, reactions: [], comments: [] }],
      },
    ]);
  });

  it("modifyInsight should modify an insight", async () => {
    mockFetchResponseJson.mockResolvedValue(mockInsight);
    const response = await modifyInsight(mockInsight, token);

    expect(fetch).toHaveBeenCalledWith(`/api/insights/${mockInsight.uid}`, {
      method: "PATCH",
      body: JSON.stringify(mockInsight),
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    expect(response).toEqual({ action: 0, facts: [mockInsight] });
  });

  it("publishInsights should publish an insight", async () => {
    mockFetchResponseJson.mockResolvedValue(mockInsight);
    const response = await publishInsights({ insights: [mockInsight] }, token);

    expect(fetch).toHaveBeenCalledWith(`/api/insights/${mockInsight.uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        uid: mockInsight.uid,
        is_public: true,
      }),
    });
    expect(response).toEqual([
      {
        action: 0,
        facts: [
          {
            ...mockInsight,
            is_public: true,
          },
        ],
      },
    ]);
  });

  it("deleteInsights should await each delete before returning", async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    let settled = false;
    const pending = deleteInsights({ insights: [mockInsight] }, token).then(
      (response) => {
        settled = true;
        return response;
      },
    );

    // DELETE must not resolve until fetch completes.
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveFetch({
      ok: true,
      json: mockFetchResponseJson,
    });

    const response = await pending;
    expect(settled).toBe(true);
    expect(fetch).toHaveBeenCalledWith(`/api/insights/${mockInsight.uid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    expect(response).toEqual({ action: -1, facts: [mockInsight] });
  });

  it("deleteInsights should throw when the server rejects the delete", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Forbidden",
      json: async () => ({ statusText: "Unauthorized" }),
    });

    await expect(
      deleteInsights({ insights: [mockInsight] }, token),
    ).rejects.toThrow("Unauthorized");
  });
});
