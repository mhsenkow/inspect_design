import { GetInsightsRouteResponse as GetInsightsRouteResponse } from "../api/insights/route";
import { Insight, Link } from "../types";

export const getInsights = async (
  origin: string,
  token?: string,
  queryParams?: URLSearchParams,
): Promise<Insight[] | boolean> => {
  if (token) {
    const insightsApiUrl = `${origin}/api/insights${queryParams ? "?" + queryParams.toString() : ""}`;

    const response = (await fetch(insightsApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })) as GetInsightsRouteResponse;

    if (response.status == 200) {
      return (await response.json()) as Insight[];
    }

    // Stale/expired sessions should fall through to the logged-out UI,
    // not crash the whole page with a runtime error.
    if (response.status === 401 || response.status === 403) {
      return false;
    }

    const err = await response.json();
    throw new Error(
      `Error fetching insights: ${err.message || err.statusText || ""}`,
    );
  }

  return Promise.resolve(false);
};

export const getLinks = async (
  origin: string,
  token?: string,
): Promise<Link[]> => {
  const response = await fetch(`${origin}/api/links`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token ?? "",
    },
  });
  if (response.status == 200) {
    return (await response.json()) as Link[];
  } else {
    throw new Error((await response.json()).message);
  }
};
