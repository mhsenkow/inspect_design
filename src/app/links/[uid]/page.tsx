"use server";

import React from "react";
import { Metadata } from "next";
import { cookies, headers } from "next/headers";

import ClientSidePage from "./ClientSidePage";
import { getLinkFromServer, getUserFromServer } from "../../api/functions";
import { Link } from "../../types";
import { getAuthUser } from "../../functions";
import { extractUidFromSlug, isNewFormatSlug } from "../../utils/slug";

interface PageProps {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata | undefined> {
  const origin = (await headers()).get("x-origin");
  const currentUrl = (await headers()).get("x-url");

  // Handle both slug format and direct UID format
  const identifier = (await params).uid;
  const uid = isNewFormatSlug(identifier)
    ? extractUidFromSlug(identifier)
    : identifier;

  const link = await getLinkFromServer(origin ?? "", uid || identifier);
  if (link) {
    return {
      openGraph: {
        url: currentUrl!,
        type: "article",
        title: link.title!,
        description: "",
        images: (link as Link).imageUrl,
        locale: "en_US",
      },
      twitter: {
        // site: "@bobstark", // TODO: once I get a dg labs/inspect account
        creator: "@bobstark",
      },
    };
  }
}

const Linkpage = async ({ params }: PageProps): Promise<React.JSX.Element> => {
  const origin = (await headers()).get("x-origin");

  // Handle both slug format and direct UID format
  const identifier = (await params).uid;
  const uid = isNewFormatSlug(identifier)
    ? extractUidFromSlug(identifier)
    : identifier;

  const link = await getLinkFromServer(origin ?? "", uid || identifier);
  const authUser = await getAuthUser(headers);
  const currentUser = authUser
    ? await getUserFromServer(
        origin ?? "",
        { id: authUser.user_id },
        (await cookies()).get("token")?.value,
      )
    : null;

  if (link) {
    return (
      <ClientSidePage
        linkInput={link}
        currentUser={currentUser || undefined}
        requestedSlug={identifier}
        uid={uid || identifier}
      />
    );
  }
  return <div>No link with this UID</div>;
};

export default Linkpage;
