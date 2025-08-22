"use server";

import React from "react";
import { Metadata } from "next";
import { cookies, headers } from "next/headers";

import ClientSidePage from "./ClientSidePage";
import { getInsightFromServer, getUserFromServer } from "../../api/functions";
import { Insight } from "../../types";
import { getAuthUser } from "../../functions";

const sortCitationCountDesc = (a: Insight, b: Insight) =>
  (a.evidence?.length ?? 0) - (b.evidence?.length ?? 0);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata | undefined> {
  const token = (await cookies()).get("token")?.value;
  const origin = (await headers()).get("x-origin");
  const currentUrl = (await headers()).get("x-url");
  const uid = (await params).uid;
  const insight = await getInsightFromServer(origin ?? "", { uid }, token);
  if (insight) {
    return {
      openGraph: {
        url: currentUrl!,
        type: "article",
        title: insight.title,
        description: `📄 ${insight.evidence?.length ?? 0}
${insight.children
  .map((cl) => cl.childInsight!)
  .sort(sortCitationCountDesc)
  .map(
    (childInsight) =>
      `${childInsight.title} 📄 ${childInsight.evidence?.length ?? 0}`,
  )
  .join(",\n")}`,
        // TODO: upload/generate an image for the insight?
        images: `${origin}/images/share_image.png`,
        locale: "en_US",
      },
      twitter: {
        // site: "@bobstark", // TODO: once I get a dg labs/inspect account
        creator: "@bobstark",
      },
    };
  }
}

const InsightPage = async ({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<React.JSX.Element> => {
  const origin = (await headers()).get("x-origin");
  const token = (await cookies()).get("token")?.value;
  const uid = (await params).uid;
  const insight = await getInsightFromServer(origin ?? "", { uid }, token);
  if (insight) {
    const authUser = await getAuthUser(headers);
    // FIXME: include a .user in the insight via ojs join?
    const currentUser = authUser
      ? await getUserFromServer(
          origin ?? "",
          { id: authUser.user_id },
          (await cookies()).get("token")?.value,
        )
      : null;

    return (
      <ClientSidePage
        insightInput={insight}
        currentUser={currentUser || null}
      />
    );
  } else {
    return <div>No insight with that UID found.</div>;
  }
};

export default InsightPage;
