"use client";

import { createInsights } from "./InsightsAPI";
import { Insight, FLVResponse, InsightEvidence, InsightLink } from "../types";
import { createLink } from "../hooks/functions";

export const createInsightFromCitations = (
  insightTitle: string,
  citations: InsightEvidence[],
  token: string,
): Promise<FLVResponse> =>
  createInsights(
    {
      insights: [
        {
          title: insightTitle,
          evidence: citations,
        } as Insight,
      ],
    },
    token,
  ).then((responses) => responses[0]);

export type addCitationsToInsightAPISchema = {
  insight: Insight;
  evidence?: InsightEvidence[];
  newLinkUrl?: string;
};
export const addCitationsToInsight = async (
  { insight, evidence, newLinkUrl }: addCitationsToInsightAPISchema,
  token: string,
): Promise<FLVResponse> => {
  if (newLinkUrl) {
    const newCitation = await createLink(newLinkUrl, token);
    if (!evidence) {
      evidence = [];
    }
    evidence.push({
      summary_id: newCitation.id,
    } as InsightEvidence);
  }

  return fetch("/api/evidence", {
    method: "POST",
    body: JSON.stringify({
      evidence: evidence?.map((c) => ({
        summary_id: c.summary_id,
        insight_id: insight.id,
      })),
    }),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then(async (response) => ({ action: 1, facts: await response.json() }));
};

export const addChildrenToInsight = async (
  {
    parentInsight,
    children,
    newChildInsightName,
  }: {
    parentInsight: Insight;
    children?: Insight[];
    newChildInsightName?: string;
  },
  token: string,
): Promise<FLVResponse> => {
  if (children == undefined) {
    children = [];
  }
  if (newChildInsightName) {
    const newChildResponse = await createInsightFromCitations(
      newChildInsightName,
      [],
      token,
    );
    const newChild = newChildResponse.facts[0] as Insight;
    children.push(newChild);
  }
  return fetch("/api/children", {
    method: "POST",
    body: JSON.stringify({
      children: children.map((c) => ({
        child_id: c.id,
        parent_id: parentInsight.id,
      })),
    }),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then(async (response: Response) => {
    if (!response.ok) {
      throw response;
    }
    const newChildrenLinks = await response.json();
    return {
      action: 1,
      facts: newChildrenLinks as InsightLink[],
    };
  });
};
