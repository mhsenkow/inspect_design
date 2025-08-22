"use server";

import React from "react";
import { cookies, headers } from "next/headers";

import { getInsights } from "./functions";
import ClientSidePage from "./ClientSidePage";
import { getUserFromServer } from "../api/functions";
import { getAuthUser } from "../functions";

const InsightsPage = async (): Promise<React.JSX.Element> => {
  const origin = (await headers()).get("x-origin") || "";
  const tokenCookie = (await cookies()).get("token");
  const token = tokenCookie ? tokenCookie.value : undefined;

  const authUser = await getAuthUser(headers);
  const currentUser = authUser
    ? await getUserFromServer(origin, { id: authUser.user_id }, token)
    : null;

  const insightSearchParams = new URLSearchParams(
    "offset=0&limit=20&parents=true&children=true&evidence=true",
  );
  insightSearchParams.sort();
  const insights = await getInsights(origin, token, insightSearchParams);

  if (insights && Array.isArray(insights)) {
    return (
      <ClientSidePage
        insights={insights.filter((i) => i.user_id == authUser?.user_id)}
        currentUser={currentUser || null}
      />
    );
  }
  return (
    <span>
      No insights available for anonymous users. Please Login or Register.
    </span>
  );
};

export default InsightsPage;
