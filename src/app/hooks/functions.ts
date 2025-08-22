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
  const result = await fetch("/api/articles", {
    method: "POST", // TODO: put a comment here/explore this some more
    headers: { "Content-Type": "text/html" },
    body: JSON.stringify({ url }),
  });
  const json = await result.json();
  const html = json.html;
  const metaTitle = getPageMetaTitle(html);
  if (metaTitle) {
    return metaTitle;
  }
  const titleTagValue = getPageTitleTagValue(html);
  if (titleTagValue) {
    return titleTagValue;
  }
  throw new Error("Summary title not found for: " + url);
};

// TODO: consider moving the below functions into other a functions file

export const createLink = async (url: string, token: string): Promise<Link> => {
  const cleanedUrl = cleanUrl(url);
  const baseUrl = parseBaseUrl(url);
  let source;
  try {
    source = await getSource({ baseurl: baseUrl! }, token);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // TODO: get rid of chrome printing out the 404
    if (!source) {
      source = await createSource(baseUrl!, token);
    }
  }
  const title = await getPageTitle(cleanedUrl);
  return fetch("/api/links", {
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
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });
};

export const getSource = (
  params: Awaited<GetSourceRouteProps["params"]>,
  token: string,
): Promise<Source> =>
  fetch(`/api/sources/${params.baseurl}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then((response: Response | GetSourceRouteResponse) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });

export const createSource = (baseUrl: string, token: string): Promise<Source> =>
  fetch(`/api/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({ baseUrl }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });

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
