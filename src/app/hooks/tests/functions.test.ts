import {
  parseSummaryUid,
  parseInsightUid,
  getPageTitle,
  decodeStringURI,
  encodeStringURI,
  encodeStringHTML,
  decodeStringHTML,
  getSource,
  createSource,
  createLink,
} from "../functions";

describe("parseSummaryUid", () => {
  it("should parse the UID from a /links URL", () => {
    const url = "https://example.com/links/abc123";
    const uid = parseSummaryUid(url);
    expect(uid).toBe("abc123");
  });

  it("should return undefined for an invalid URL", () => {
    const url = "https://example.com/invalid/abc123";
    let uid;
    try {
      uid = parseSummaryUid(url);
    } catch (err) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err).toBeTruthy();
    }
    expect(uid).toBeUndefined();
  });
});

describe("parseInsightUid", () => {
  it("should parse the UID from an /insights URL", () => {
    const url = "https://example.com/insights/xyz789";
    const uid = parseInsightUid(url);
    expect(uid).toBe("xyz789");
  });

  it("should return undefined for an invalid URL", () => {
    const url = "https://example.com/invalid/xyz789";
    let uid;
    try {
      uid = parseInsightUid(url);
    } catch (err) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err).toBeTruthy();
    }
    expect(uid).toBeUndefined();
  });
});

describe("getPageTitle", () => {
  it("should fetch the page title from the given URL", async () => {
    const mockFetch = jest.fn();
    window.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          html: "<html><head><title>Test Title</title><meta property='og:title' content='Test Title 2' /></head><body></body></html>",
        }),
    });

    const title = await getPageTitle("https://example.com");
    expect(title).toBe("Test Title 2");
    expect(mockFetch).toHaveBeenCalledWith("/api/articles", expect.any(Object));
  });

  it("should decode html entities from the title", async () => {
    const mockFetch = jest.fn();
    window.fetch = mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          html: "<html><head><meta property='og:title' content='Test &amp; Title' /></head><body></body></html>",
        }),
    });

    const title = await getPageTitle("https://example.com");
    expect(title).toBe("Test & Title");
  });

  it("should throw an error if the og:title meta tag is not found", async () => {
    const mockFetch = jest.fn();
    window.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({ html: "<html><head></head><body></body></html>" }),
    });

    await expect(
      async () => await getPageTitle("https://example.com"),
    ).rejects.toThrow("Summary title not found for: https://example.com");
  });
});
describe("decodeStringURI", () => {
  it("should decode a URI encoded string", () => {
    const encodedTitle = "Test%20Title";
    const decodedTitle = decodeStringURI(encodedTitle);
    expect(decodedTitle).toBe("Test Title");
  });

  it("should decode a string with special characters", () => {
    const encodedTitle = "Test%20%26%20Title";
    const decodedTitle = decodeStringURI(encodedTitle);
    expect(decodedTitle).toBe("Test & Title");
  });

  it("should decode a string with mixed characters", () => {
    const encodedTitle = "Test%20%26%20%23%20Title";
    const decodedTitle = decodeStringURI(encodedTitle);
    expect(decodedTitle).toBe("Test & # Title");
  });

  it("should return the same string if there are no encoded characters", () => {
    const encodedTitle = "Test Title";
    const decodedTitle = decodeStringURI(encodedTitle);
    expect(decodedTitle).toBe("Test Title");
  });

  it("should handle an empty string", () => {
    const encodedTitle = "";
    const decodedTitle = decodeStringURI(encodedTitle);
    expect(decodedTitle).toBe("");
  });
});
describe("encodeStringURI", () => {
  it("should encode a string with spaces", () => {
    const title = "Test Title";
    const encodedTitle = encodeStringURI(title);
    expect(encodedTitle).toBe("Test%20Title");
  });

  it("should encode a string with special characters", () => {
    const title = "Test & Title";
    const encodedTitle = encodeStringURI(title);
    expect(encodedTitle).toBe("Test%20%26%20Title");
  });

  it("should encode a string with mixed characters", () => {
    const title = "Test & # Title";
    const encodedTitle = encodeStringURI(title);
    expect(encodedTitle).toBe("Test%20%26%20%23%20Title");
  });

  it("should return the same string if there are no characters to encode", () => {
    const title = "TestTitle";
    const encodedTitle = encodeStringURI(title);
    expect(encodedTitle).toBe("TestTitle");
  });

  it("should handle an empty string", () => {
    const title = "";
    const encodedTitle = encodeStringURI(title);
    expect(encodedTitle).toBe("");
  });
});
describe("encodeStringHTML", () => {
  it("should encode a string with special HTML characters", () => {
    const string = "Test & Title";
    const encodedString = encodeStringHTML(string);
    expect(encodedString).toBe("Test &amp; Title");
  });

  it("should encode a string with mixed HTML characters", () => {
    const string = "Test & <Title>";
    const encodedString = encodeStringHTML(string);
    expect(encodedString).toBe("Test &amp; &lt;Title&gt;");
  });

  it("should return the same string if there are no characters to encode", () => {
    const string = "TestTitle";
    const encodedString = encodeStringHTML(string);
    expect(encodedString).toBe("TestTitle");
  });

  it("should handle an empty string", () => {
    const string = "";
    const encodedString = encodeStringHTML(string);
    expect(encodedString).toBe("");
  });
});

describe("decodeStringHTML", () => {
  it("should decode a string with special HTML characters", () => {
    const string = "Test &amp; Title";
    const decodedString = decodeStringHTML(string);
    expect(decodedString).toBe("Test & Title");
  });

  it("should decode a string with mixed HTML characters", () => {
    const string = "Test &amp; &lt;Title&gt;";
    const decodedString = decodeStringHTML(string);
    expect(decodedString).toBe("Test & <Title>");
  });

  it("should return the same string if there are no characters to decode", () => {
    const string = "TestTitle";
    const decodedString = decodeStringHTML(string);
    expect(decodedString).toBe("TestTitle");
  });

  it("should handle an empty string", () => {
    const string = "";
    const decodedString = decodeStringHTML(string);
    expect(decodedString).toBe("");
  });
});

describe("Create link", () => {
  it("should create a link in the simple case", async () => {
    window.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }) // getSource
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            html: "<html><head><title>Test Title</title><meta property='og:title' content='Test Title 2' /></head><body></body></html>",
          }),
      }) // page title
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }); // the POST

    const result = await createLink("https://example.com", "token");

    expect(window.fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ id: 1 });
  });

  it("should strip a link's title of URI encoded characters", async () => {
    const title = "Page%20Title";
    const cleanedUrl = "https://example.com";

    window.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }) // source
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            html: `<html><head><title>Test Title</title><meta property='og:title' content='${title}' /></head><body></body></html>`,
          }),
      }) // page title
      .mockResolvedValueOnce({
        ok: true,

        json: () => Promise.resolve({ id: 1, title: "Page Title" }),
      }); // the POST

    await createLink("https://example.com", "token");

    expect(window.fetch).toHaveBeenCalledTimes(3);
    expect(window.fetch).toHaveBeenNthCalledWith(
      1,
      `/api/sources/example.com`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "token",
        },
      },
    );
    expect(window.fetch).toHaveBeenNthCalledWith(2, "/api/articles", {
      body: JSON.stringify({ url: cleanedUrl }),
      method: "POST",
      headers: { "Content-Type": "text/html" },
    });
    expect(window.fetch).toHaveBeenNthCalledWith(3, "/api/links", {
      body: JSON.stringify({
        url: cleanedUrl,
        source_id: 1,
        title,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": "token",
      },
    });
  });

  it("should make an extra fetch call if the getSource call throws an error", async () => {
    window.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error")) // getSource error
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }) // createSource
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            html: "<html><head><title>Test Title</title><meta property='og:title' content='Test Title 2' /></head><body></body></html>",
          }),
      }) // page title
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }); // the POST

    const result = await createLink("https://example.com", "token");

    expect(window.fetch).toHaveBeenCalledTimes(4);
    expect(result).toEqual({ id: 1 });
  });
});

it("should get a source", async () => {
  const source = { id: 1 };
  (window.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(source),
  });
  const baseUrl = "https://example.com";

  const result = await getSource({ baseurl: baseUrl }, "token");

  expect(window.fetch).toHaveBeenCalledWith(`/api/sources/${baseUrl}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": "token",
    },
  });
  expect(result).toEqual(source);
});

it("should create a source", async () => {
  (window.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,

    json: () => Promise.resolve({ id: 1 }),
  });
  const baseUrl = "https://example.com";

  const result = await createSource(baseUrl, "token");

  expect(window.fetch).toHaveBeenCalledWith(`/api/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": "token",
    },
    body: JSON.stringify({ baseUrl }),
  });
  expect(result).toEqual({ id: 1 });
});
