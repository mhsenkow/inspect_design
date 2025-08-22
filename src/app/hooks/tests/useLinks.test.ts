/* eslint-disable jest/no-disabled-tests */
import { renderHook, waitFor } from "@testing-library/react";
import useLinks from "../useLinks";
import { encodeStringURI } from "../functions";

describe("useLinks", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should NOT get links with offset and limit", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([1, 2, 3]),
    });
    const { result } = renderHook(() =>
      useLinks({ offset: 0, limit: 20, query: null }),
    );

    expect(result.current[0]).toBeUndefined();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });
  });

  it("should get links with offset, limit, and query", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,

      json: () => Promise.resolve([4, 5, 6]),
    });
    const { result } = renderHook(() =>
      useLinks({ offset: 0, limit: 20, query: encodeStringURI("title=query") }),
    );

    expect(result.current[0]).toBeUndefined();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/links?offset=0&limit=20&query=title%3Dquery",
      );
      expect(result.current[0]).toEqual([4, 5, 6]);
    });
  });

  // TODO: no one knows how to test for hooks throwing errors
  it.skip("should throw errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );

    const result = renderHook(() =>
      useLinks({ offset: 0, limit: 20, query: null }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toThrow("Failed to fetch");
    });
  });
});
