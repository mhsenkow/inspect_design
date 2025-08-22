import { GetInsightsRouteResponse as GetInsightsRouteResponse } from "../api/insights/route";
import { Insight, Link } from "../types";

export const getInsights = async (
  origin: string,
  token?: string,
  queryParams?: URLSearchParams,
): Promise<Insight[] | boolean> => {
  if (token) {
    const response = (await fetch(
      `${origin}/api/insights${queryParams ? "?" + queryParams.toString() : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      },
    )) as GetInsightsRouteResponse;

    if (response.status == 200) {
      return (await response.json()) as Insight[];
    } else {
      throw new Error((await response.json()).message);
    }
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
