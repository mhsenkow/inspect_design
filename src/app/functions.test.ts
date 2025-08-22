import { headers } from "next/headers";
import {
  getDisabledInsightIds,
  getUnreadSummariesForCurrentUser,
  submitComment,
  deleteComment,
  submitReaction,
  debounce,
  getAuthUser,
  getColumnName,
  getSortFunction,
} from "./functions";
import { Insight, InsightEvidence } from "./types";

jest.mock("next/headers");

describe("functions", () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUnreadSummariesForCurrentUser", () => {
    it("should fetch unread summaries", async () => {
      const mockResponse = [{ id: 1, title: "Summary 1" }];
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await getUnreadSummariesForCurrentUser(
        "http://example.com",
        0,
        "token",
      );
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://example.com/api/unread_summaries?offset=0&limit=20",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": "token",
          },
        },
      );
    });
  });

  describe("submitComment", () => {
    const now = new Date().toLocaleDateString();
    const mockResponse = {
      id: 1,
      comment: "Nice post!",
      created_at: now,
      user_id: 1,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });
    });

    it("should submit a comment for an insight", async () => {
      const result = await submitComment(
        { comment: "Nice post!", insight_id: 1 },
        "token",
      );
      expect(result).toEqual({
        id: 1,
        comment: "Nice post!",
        created_at: now,
        user_id: 1,
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          comment: "Nice post!",
          insight_id: 1,
          summary_id: undefined,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "token",
        },
      });
    });

    it("should submit a comment for a summary", async () => {
      const result = await submitComment(
        { comment: "Nice post!", summary_id: 1 },
        "token",
      );
      expect(result).toEqual({
        id: 1,
        comment: "Nice post!",
        created_at: now,
        user_id: 1,
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          comment: "Nice post!",
          insight_id: undefined,
          summary_id: 1,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "token",
        },
      });
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment", async () => {
      mockFetch.mockResolvedValueOnce({ status: 200, rowCount: 1 });

      const result = await deleteComment({ id: 1 }, "token");
      expect(mockFetch).toHaveBeenCalledWith("/api/comments/1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "token",
        },
      });
      expect(result).toBe(true);
    });
  });

  describe("submitReaction", () => {
    it("should submit a reaction", async () => {
      const mockResponse = { reaction: "😬" };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await submitReaction(
        { reaction: "😬", insight_id: 1, summary_id: 2 },
        "token",
      );
      expect(result).toEqual({ summary_id: undefined, reaction: "😬" });
      expect(mockFetch).toHaveBeenCalledWith("/api/reactions", {
        method: "POST",
        body: JSON.stringify({ reaction: "😬", insight_id: 1, summary_id: 2 }),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "token",
        },
      });
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    it("should debounce a function", () => {
      const func = jest.fn();
      debounce({
        func,
        wait: 300,
      });

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalled();
    });
  });

  describe("getDisabledInsightIds", () => {
    it("should fetch disabled insight ids", async () => {
      const mockPotentialInsights = [
        {
          id: 1,
          title: "Insight 1",
          evidence: [{ summary_id: 1 }],
        },
        {
          id: 2,
          title: "Insight 2",
          evidence: [{ summary_id: 1 }, { summary_id: 2 }],
        },
      ];
      const mockSelectedCitations = [{ id: 1, title: "Link 1", summary_id: 2 }];

      const result = getDisabledInsightIds(
        mockPotentialInsights as Insight[],
        mockSelectedCitations as unknown as InsightEvidence[],
      );
      expect(result).toEqual([2]);
    });
  });

  describe("getAuthUser", () => {
    it("should return the auth user when they are logged in", async () => {
      (headers as jest.Mock).mockResolvedValueOnce({
        get: () =>
          JSON.stringify({
            user_id: 2,
          }),
      });
      const result = await getAuthUser(headers);
      expect(result).toBeTruthy();
      expect(result!.user_id).toBe(2);
    });

    it("should return null when they are NOT logged in", async () => {
      (headers as jest.Mock).mockResolvedValueOnce({
        get: () => undefined,
      });
      const result = await getAuthUser(headers);
      expect(result).toBe(null);
    });
  });

  describe("getColumnName", () => {
    const data = [{ a: 1, b: 2 }];

    it("returns the first found column name", () => {
      const columnName = getColumnName(data, "b", "c");
      expect(columnName).toBe("b");
    });

    it("returns undefined if no column name was found", () => {
      const columnName = getColumnName(data, "d", "e", "f");
      expect(columnName).toBe(undefined);
    });
  });

  describe("getSortFunction", () => {
    const sortNumbersAsc = (a: number, b: number) => a - b;
    const sortCharsAsc = (a: string, b: string) =>
      a.charCodeAt(0) - b.charCodeAt(0);
    const sortDatesAsc = (a: string, b: string) =>
      new Date(a).getTime() - new Date(b).getTime();
    const sortArraysAsc = (a: number[], b: number[]) => a.length - b.length;
    const sortBooleansAsc = (a: boolean, b: boolean) => Number(a) - Number(b);

    const sortNumbersDesc = (a: number, b: number) => b - a;
    const sortCharsDesc = (a: string, b: string) =>
      b.charCodeAt(0) - a.charCodeAt(0);
    const sortDatesDesc = (a: string, b: string) =>
      new Date(b).getTime() - new Date(a).getTime();
    const sortArraysDesc = (a: number[], b: number[]) => b.length - a.length;
    const sortBooleansDesc = (a: boolean, b: boolean) => Number(b) - Number(a);

    const toChar = (n: number) => String.fromCharCode(n + 96);
    const toDate = (n: number) => new Date(n).toDateString();
    const toArray = (n: number) => Array.from({ length: n }, (_, i) => 1 + i);
    const toBoolean = (n: number) => n % 2 == 0;

    const numbers = Array.from({ length: 10 }, (_, i) => 1 + i);
    const characters = numbers.map((n) => toChar(n));
    const dates = numbers.map((n) => toDate(n));
    const arrays = numbers.map((n) => toArray(n));
    const booleans = numbers.map((n) => toBoolean(n));
    const objects = numbers.map((n) => ({
      n,
      c: toChar(n),
      d: toDate(n),
      a: toArray(n),
      b: toBoolean(n),
    }));

    it("sorts numbers ascending", () => {
      const sortFunction = getSortFunction({ column: "n", dir: "asc" });
      const sortedNumbers = objects.sort(sortFunction).map((o) => o.n);
      expect(JSON.stringify(sortedNumbers)).toEqual(
        JSON.stringify(numbers.sort(sortNumbersAsc)),
      );
    });

    it("sorts numbers descending", () => {
      const sortFunction = getSortFunction({ column: "n", dir: "desc" });
      const sortedNumbers = objects.sort(sortFunction).map((o) => o.n);
      expect(JSON.stringify(sortedNumbers)).toEqual(
        JSON.stringify(numbers.sort(sortNumbersDesc)),
      );
    });

    it("sorts characters ascending", () => {
      const sortFunction = getSortFunction({ column: "c", dir: "asc" });
      const sortedCharacters = objects.sort(sortFunction).map((o) => o.c);
      expect(JSON.stringify(sortedCharacters)).toEqual(
        JSON.stringify(characters.sort(sortCharsAsc)),
      );
    });

    it("sorts characters descending", () => {
      const sortFunction = getSortFunction({ column: "c", dir: "desc" });
      const sortedCharacters = objects.sort(sortFunction).map((o) => o.c);
      expect(JSON.stringify(sortedCharacters)).toEqual(
        JSON.stringify(characters.sort(sortCharsDesc)),
      );
    });

    it("sorts string dates ascending", () => {
      const sortFunction = getSortFunction({ column: "d", dir: "asc" });
      const sortedDates = objects.sort(sortFunction).map((o) => o.d);
      expect(JSON.stringify(sortedDates)).toEqual(
        JSON.stringify(dates.sort(sortDatesAsc)),
      );
    });

    it("sorts string dates descending", () => {
      const sortFunction = getSortFunction({ column: "d", dir: "desc" });
      const sortedDates = objects.sort(sortFunction).map((o) => o.d);
      expect(JSON.stringify(sortedDates)).toEqual(
        JSON.stringify(dates.sort(sortDatesDesc)),
      );
    });

    it("sorts array lengths ascending", () => {
      const sortFunction = getSortFunction({ column: "a", dir: "asc" });
      const sortedArrayLengths = objects
        .sort(sortFunction)
        .map((o) => o.a)
        .map((a) => a.length);
      expect(JSON.stringify(sortedArrayLengths)).toEqual(
        JSON.stringify(arrays.sort(sortArraysAsc).map((a) => a.length)),
      );
    });

    it("sorts array lengths descending", () => {
      const sortFunction = getSortFunction({ column: "a", dir: "desc" });
      const sortedArrayLengths = objects
        .sort(sortFunction)
        .map((o) => o.a)
        .map((a) => a.length);
      expect(JSON.stringify(sortedArrayLengths)).toEqual(
        JSON.stringify(arrays.sort(sortArraysDesc).map((a) => a.length)),
      );
    });

    it("sorts booleans ascending", () => {
      const sortFunction = getSortFunction({ column: "b", dir: "asc" });
      const sortedBooleans = objects.sort(sortFunction).map((o) => o.b);
      expect(JSON.stringify(sortedBooleans)).toEqual(
        JSON.stringify(booleans.sort(sortBooleansAsc)),
      );
    });

    it("sorts booleans descending", () => {
      const sortFunction = getSortFunction({ column: "b", dir: "desc" });
      const sortedBooleans = objects.sort(sortFunction).map((o) => o.b);
      expect(JSON.stringify(sortedBooleans)).toEqual(
        JSON.stringify(booleans.sort(sortBooleansDesc)),
      );
    });
  });
});
