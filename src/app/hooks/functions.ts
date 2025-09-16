import { encode as encodeHTML, decode as decodeHTML } from "html-entities";
import { Link, Source } from "../types";
import {
  GetSourceRouteProps,
  GetSourceRouteResponse,
} from "../api/sources/[baseurl]/route";

const parseUidFromURL = (
  textWithURL: string,
  basePath: string,
): string | undefined => {
  const x = textWithURL.match(new RegExp(`${basePath}/([a-z0-9]+)`));
  if (x) {
    return x[1];
  }
};

export const parseSummaryUid = (textWithURL: string): string | undefined =>
  parseUidFromURL(textWithURL, "/links");

export const parseInsightUid = (textWithURL: string): string | undefined =>
  parseUidFromURL(textWithURL, "/insights");

export const decodeStringURI = (string: string): string =>
  // credit: https://stackoverflow.com/a/54310080
  decodeURIComponent(string.replace(/%(?![0-9][0-9a-fA-F]+)/g, "%25"));

export const encodeStringURI = (string: string): string =>
  // credit: https://stackoverflow.com/a/54310080
  encodeURIComponent(string.replace(/%(?![0-9][0-9a-fA-F]+)/g, "%25"));

export const decodeStringHTML = (string: string): string => decodeHTML(string);

export const encodeStringHTML = (string: string): string => encodeHTML(string);

const getPageTitleTagValue = (html: string) => {
  const isTitleStart = (html: string, i: number) =>
    html.substring(i, i + 6) == "<title";
  const isTitleEnd = (html: string, i: number) =>
    html.substring(i, i + 8) == "</title>";
  let withinTitleTag = false;
  let titleString = "";
  for (let i = 0; i < html.length; i++) {
    if (withinTitleTag) {
      if (isTitleEnd(html, i)) {
        break;
      } else {
        titleString += html[i];
        continue;
      }
    } else {
      if (isTitleStart(html, i)) {
        withinTitleTag = true;
        i += html.substring(i).indexOf(">");
        continue;
      }
    }
  }
  return decodeStringHTML(titleString);
};

const getPageMetaTitle = (html: string) => {
  const metaTagMatch = html.match(
    /<meta.+(name|property)=["']og:title["']\s+content=["'](.*?)["']/i,
  );
  if (metaTagMatch && metaTagMatch[2]) {
    return decodeStringHTML(metaTagMatch[2]);
  }
};

export const getPageTitle = async (url: string): Promise<string> => {
  try {
    const result = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    
    if (!result.ok) {
      const errorData = await result.json().catch(() => ({}));
      const errorMessage = errorData.message || result.statusText;
      throw new Error(`Failed to fetch article: ${result.status} ${errorMessage}`);
    }
    
    const json = await result.json();
    const html = json.html;
    
    if (!html) {
      throw new Error("No HTML content received from URL");
    }
    
    const metaTitle = getPageMetaTitle(html);
    if (metaTitle) {
      return metaTitle;
    }
    const titleTagValue = getPageTitleTagValue(html);
    if (titleTagValue) {
      return titleTagValue;
    }
    throw new Error("No title found in page content");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while fetching page title");
  }
};

// TODO: consider moving the below functions into other a functions file

export const createLink = async (url: string, token: string): Promise<Link> => {
  try {
    // Validate URL format first
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }
    
    const cleanedUrl = cleanUrl(url);
    const baseUrl = parseBaseUrl(url);
    
    if (!baseUrl) {
      throw new Error("Invalid URL format - could not parse base URL");
    }
    
    let source;
    try {
      source = await getSource({ baseurl: baseUrl }, token);
    } catch (error) {
      console.log("Source not found, creating new source:", baseUrl);
      try {
        source = await createSource(baseUrl, token);
      } catch (createError) {
        console.error("Failed to create source:", createError);
        throw new Error(`Failed to create source for ${baseUrl}`);
      }
    }
    
    if (!source || !source.id) {
      throw new Error("Source creation failed - no source ID available");
    }
    
    let title;
    try {
      title = await getPageTitle(cleanedUrl);
    } catch (error) {
      console.error("Failed to get page title:", error);
      // Use the URL as fallback title if page title fails
      title = `Link: ${cleanedUrl}`;
    }
    
    const response = await fetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        url: cleanedUrl,
        source_id: source.id,
        title,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      throw new Error(`Failed to create link: ${response.status} ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while creating link");
  }
};

export const getSource = async (
  params: Awaited<GetSourceRouteProps["params"]>,
  token: string,
): Promise<Source> => {
  try {
    const response = await fetch(`/api/sources/${params.baseurl}`, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      throw new Error(`Failed to get source: ${response.status} ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while getting source");
  }
};

export const createSource = async (baseUrl: string, token: string): Promise<Source> => {
  try {
    const response = await fetch(`/api/sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({ baseUrl }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      throw new Error(`Failed to create source: ${response.status} ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while creating source");
  }
};

export const cleanUrl = (url: string): string => {
  const qPosition = url.indexOf("?"),
    justUrl = url.substring(0, qPosition > -1 ? qPosition : url.length);
  return justUrl;
};

const baseUrlRegex = RegExp("https?://([a-zA-Z0-9]+\\.[a-z]+)\\/?.*");
const subdomainRegex = RegExp("https?://.*\\.([a-zA-Z0-9]+\\.[a-z]+)\\/?.*");
export const parseBaseUrl = (fullUrl: string): string | undefined => {
  const match1 = fullUrl.match(baseUrlRegex);
  const match2 = fullUrl.match(subdomainRegex);
  if (match2) {
    return match2[1];
  }
  return match1 ? match1[1] : undefined;
};
