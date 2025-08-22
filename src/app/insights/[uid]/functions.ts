import React from "react";

import {
  ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID,
  ADD_LINKS_AS_EVIDENCE_DIALOG_ID,
  ADD_PARENT_INSIGHTS_DIALOG_ID,
} from "./ClientSidePage";
import {
  FLVResponse,
  Insight,
  InsightEvidence,
  InsightLink,
} from "../../types";
import {
  addChildrenToInsight,
  addCitationsToInsight,
  createInsightFromCitations,
} from "../../components/SelectedCitationsAPI";
import { createInsights } from "../../components/InsightsAPI";

// show dialogs/modals
export const showAddLinksAsEvidenceDialog = () => {
  const dialog = document.getElementById(ADD_LINKS_AS_EVIDENCE_DIALOG_ID);
  (dialog as HTMLDialogElement).showModal();
};

export const showAddChildInsightsDialog = () => {
  const dialog = document.getElementById("addChildInsightsDialog");
  (dialog as HTMLDialogElement).showModal();
};

export const openAddCitationsToOtherInsightsDialog = () => {
  const dialog = document.getElementById(
    ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID,
  );
  (dialog as HTMLDialogElement).showModal();
};

export const getShowConfirmationFunction =
  <T>(
    setServerFunctionInput: React.Dispatch<React.SetStateAction<T | undefined>>,
  ) =>
  (input?: T) => {
    if (input && confirm("Are you sure?")) {
      setServerFunctionInput(input);
    }
  };

// API calls
export type doDeleteInsightCitationsSchema = {
  citations: InsightEvidence[];
};
export const doDeleteInsightCitations = async (
  { citations }: doDeleteInsightCitationsSchema,
  token: string,
): Promise<FLVResponse> => {
  await Promise.all(
    citations.map((citation) =>
      fetch(`/api/evidence/${citation.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      }),
    ),
  );
  return { action: -1, facts: citations };
};

export interface doAddCitationsToOtherInsightsSchema {
  selectedCitations: InsightEvidence[];
  citationsToRemove: InsightEvidence[];
  selectedInsights: Insight[];
  newInsightName: string;
}
export const doAddCitationsToOtherInsights = async (
  {
    selectedCitations,
    citationsToRemove,
    selectedInsights,
    newInsightName,
  }: doAddCitationsToOtherInsightsSchema,
  token: string,
): Promise<FLVResponse> => {
  if (newInsightName) {
    await createInsightFromCitations(newInsightName, selectedCitations, token);
  }

  await Promise.all(
    selectedInsights.map(async (insight) => {
      await addCitationsToInsight(
        {
          insight,
          evidence: selectedCitations,
        },
        token,
      );
    }),
  );

  const deleteResponse = await doDeleteInsightCitations(
    { citations: citationsToRemove },
    token,
  );
  // only return deleteResponse because this function is called on the /insights/uid page of citations
  // i.e., the first two responses are for other insights, so are irrelevant to the FLV
  return deleteResponse;
};

export const doDeleteInsightChildren = async (
  childrenToDelete: InsightLink[],
  token: string,
): Promise<FLVResponse> => {
  await Promise.all(
    childrenToDelete.map((c) =>
      fetch(`/api/children/${c.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      }),
    ),
  );
  return { action: -1, facts: childrenToDelete };
};

export const showAddParentInsightsDialog = () => {
  const dialog = document.getElementById(ADD_PARENT_INSIGHTS_DIALOG_ID);
  (dialog as HTMLDialogElement).showModal();
};

export type doAddParentInsightsSchema = {
  childInsight: Insight;
  newParentInsights: Insight[];
  newInsightName: string;
};
export const doAddParentInsights = async (
  {
    childInsight,
    newParentInsights,
    newInsightName,
  }: doAddParentInsightsSchema,
  token: string,
) => {
  const flvResponses = [] as FLVResponse[];
  if (newParentInsights && newParentInsights.length > 0) {
    const newChildrenLinks = await Promise.all(
      newParentInsights.map(async (parentInsight) =>
        addChildrenToInsight(
          {
            parentInsight,
            children: [childInsight],
          },
          token,
        ),
      ),
    ).then((responses) => {
      const flvResponseFacts = responses
        .map((r) => r.facts as InsightLink[])
        .flat();
      return flvResponseFacts;
    });
    flvResponses.push({
      action: 1,
      facts: newChildrenLinks,
    });
  }
  if (newInsightName) {
    const responses = await createInsights(
      { insights: [{ title: newInsightName } as Insight] },
      token,
    );
    const newInsight = responses[0].facts[0] as Insight;
    const newChildrenLink = await addChildrenToInsight(
      { parentInsight: newInsight, children: [childInsight] },
      token,
    ).then((response) => response.facts);
    flvResponses.push({
      action: 1,
      facts: newChildrenLink,
    });
  }
  return flvResponses;
};

export const doDeleteParentInsights = async (
  parentInsightLinksToDelete: InsightLink[],
  token: string,
): Promise<FLVResponse | void> => {
  const responses = await Promise.all(
    parentInsightLinksToDelete.map((parentInsightLink) => {
      return fetch(`/api/children/${parentInsightLink.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });
    }),
  );
  if (
    responses.filter((r) => r.status == 200).length ==
    parentInsightLinksToDelete.length
  ) {
    return {
      action: -1,
      facts: parentInsightLinksToDelete.map((l) => l.parentInsight!),
    };
  }
};

export const potentialInsightsWithoutLoops = (
  insight: Insight,
  potentialInsights: Insight[],
): Insight[] => {
  // Filter out the specified insight
  let filteredInsights = potentialInsights.filter((i) => i.id != insight.id);
  // Filter out insights that are parents of the specified insight
  filteredInsights = filteredInsights.filter(
    (i) => !i.children?.some((childLink2) => childLink2.child_id == insight.id),
  );
  // Filter out insights that are children of the specified insight
  filteredInsights = filteredInsights.filter(
    (i) => !insight.children?.some((childLink) => childLink.child_id == i.id),
  );
  // Filter out insights that are parents of the specified insight's children
  filteredInsights = filteredInsights.filter(
    (i) =>
      !insight.children?.some(
        (childLink) =>
          i.children?.some(
            (childLink2) => childLink2.child_id == childLink.child_id,
          ) ?? false,
      ),
  );
  return filteredInsights;
};
