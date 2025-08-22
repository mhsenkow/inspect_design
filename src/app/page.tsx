"use server";

import React from "react";
import { redirect } from "next/navigation";

const IndexPage = async (): Promise<React.JSX.Element> => {
  redirect("/insights");
};

export default IndexPage;
