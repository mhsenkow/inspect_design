"use server";

import { Insight, User, Link } from "../types";
import {
  InsightRouteProps,
  GetInsightRouteResponse,
} from "./insights/[uid]/route";
import { GetUserRouteProps, GetUserRouteResponse } from "./users/[id]/route";

export const getUserFromServer = async (
  origin: string,
  params: Awaited<GetUserRouteProps["params"]>,
  token?: string,
): Promise<User | void> => {
  const response = (await fetch(`${origin}/api/users/${params.id}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token ?? "",
    },
  })) as GetUserRouteResponse;
  if (response.status == 200) {
    return (await response.json()) as User;
  } else {
    throw "User not found";
  }
};

export const getInsightFromServer = async (
  origin: string,
  params: Awaited<InsightRouteProps["params"]>,
  token?: string,
): Promise<Insight> => {
  const response = (await fetch(`${origin}/api/insights/${params.uid}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token ?? "",
    },
  })) as GetInsightRouteResponse;
  if (response.status == 200) {
    return (await response.json()) as Insight;
  } else {
    throw response;
  }
};

export const getLinkFromServer = async (
  origin: string,
  uid: string,
): Promise<Link | void> => {
  const response = await fetch(`${origin}/api/links/${uid}`);
  if (response.status == 200) {
    return await response.json();
  } else {
    // throw response; // TODO: no idea where this error is wrapped & returned!
    return undefined;
  }
};
