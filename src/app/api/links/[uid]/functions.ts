"use server";

import openGraphScraper from "open-graph-scraper";

export const getPageHeaderImageUrl = async (
  url: string,
): Promise<string | undefined> => {
  const { error, result } = await openGraphScraper({ url });
  if (!error && result.ogImage) {
    return result.ogImage[0].url;
  }
  return undefined;
};
