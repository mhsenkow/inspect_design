/**
 * @jest-environment node
 */

import { getPageHeaderImageUrl } from "./functions";
import openGraphScraper from "open-graph-scraper";

jest.mock("open-graph-scraper");

describe("getPageHeaderImageUrl", () => {
  it("should return the og:image URL from the website", async () => {
    const url = "https://example.com";
    const ogImageUrl = "https://example.com/image.jpg";

    (openGraphScraper as jest.Mock).mockResolvedValue({
      error: false,
      result: { ogImage: [{ url: ogImageUrl }] },
    });

    const result = await getPageHeaderImageUrl(url);

    expect(result).toBe(ogImageUrl);
  });

  it("should return undefined if openGraphScraper fails", async () => {
    const url = "https://example.com";
    const errorResult = { error: true, result: "Error message" };

    (openGraphScraper as jest.Mock).mockResolvedValue(errorResult);

    const result = await getPageHeaderImageUrl(url);
    expect(result).toBeUndefined();
  });
});
