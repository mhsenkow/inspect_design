/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock fetch globally
global.fetch = jest.fn();

describe("POST /api/articles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if URL is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.message).toBe("url in body is required");
  });

  it("should return 400 if URL format is invalid", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ url: "invalid-url" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.message).toBe("Invalid URL format");
  });

  it("should successfully fetch HTML content", async () => {
    const mockHtml =
      "<html><head><title>Test Page</title></head><body>Content</body></html>";
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue(mockHtml),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const req = {
      json: jest.fn().mockResolvedValue({ url: "https://example.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.html).toBe(mockHtml);
  });

  it("should handle 403 Forbidden responses", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const req = {
      json: jest.fn().mockResolvedValue({ url: "https://blocked-site.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.message).toContain("Website blocked our request");
  });

  it("should handle 404 Not Found responses", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const req = {
      json: jest
        .fn()
        .mockResolvedValue({ url: "https://nonexistent-site.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.message).toContain("Website blocked our request");
  });

  it("should handle network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const req = {
      json: jest
        .fn()
        .mockResolvedValue({ url: "https://unreachable-site.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.message).toBe("Internal server error while fetching article");
  });

  it("should handle timeout errors", async () => {
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(timeoutError);

    const req = {
      json: jest.fn().mockResolvedValue({ url: "https://slow-site.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(408);

    const json = await response.json();
    expect(json.message).toBe("Request timeout - URL took too long to respond");
  });

  it("should handle empty HTML content", async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue(""),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const req = {
      json: jest.fn().mockResolvedValue({ url: "https://empty-site.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.message).toBe("No content found at URL");
  });

  it("should try multiple fetch strategies", async () => {
    const mockHtml =
      "<html><head><title>Test Page</title></head><body>Content</body></html>";

    // First strategy fails, second succeeds
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      })
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

    const req = {
      json: jest.fn().mockResolvedValue({ url: "https://example.com" }),
    } as unknown as NextRequest;

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.html).toBe(mockHtml);

    // Should have tried multiple strategies
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
