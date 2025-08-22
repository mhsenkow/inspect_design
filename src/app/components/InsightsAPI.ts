import { PostInsightsRouteResponse } from "../api/insights/route";
import { FLVResponse, Insight, InsightEvidence, WithPartial } from "../types";

export type InsightsAPISchema = {
  insights: Insight[];
  url?: string;
};

export const createInsights = (
  { insights }: InsightsAPISchema,
  token: string,
): Promise<FLVResponse[]> =>
  Promise.all(
    insights.map((insight) =>
      // TODO: verify insight matches Awaited<PostInsightsRouteRequestBody>
      fetch("/api/insights", {
        method: "POST",
        body: JSON.stringify(insight),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      })
        .then((response: Response | PostInsightsRouteResponse) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then(
          (insight: Insight) =>
            ({
              action: 1,
              facts: [insight],
            }) as FLVResponse,
        ),
    ),
  );

type PartialInsightProperties = WithPartial<
  Omit<Insight, "uid" | "children" | "evidence">,
  keyof Omit<Insight, "uid" | "children" | "evidence">
> & {
  children?: Partial<Insight>[];
  evidence?: Partial<InsightEvidence>[];
};

export const modifyInsight = (
  insight: Pick<Insight, "uid"> &
    PartialInsightProperties & {
      removeChildren?: Pick<InsightEvidence, "id">[];
      removeEvidence?: Pick<InsightEvidence, "summary_id">[];
    },
  token: string,
): Promise<FLVResponse> =>
  fetch(`/api/insights/${insight.uid}`, {
    method: "PATCH",
    body: JSON.stringify(insight),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((updatedPartialInsight: Partial<Insight>) => ({
      action: 0,
      facts: [
        {
          ...insight,
          ...updatedPartialInsight,
        },
      ],
    }));

export const publishInsights = (
  { insights }: InsightsAPISchema,
  token: string,
): Promise<FLVResponse[]> =>
  Promise.all(
    insights.map((insight) =>
      modifyInsight({ uid: insight.uid, is_public: true } as Insight, token),
    ),
  );

export const deleteInsights = async (
  { insights }: InsightsAPISchema,
  token: string,
): Promise<FLVResponse> => {
  const finalResponse: FLVResponse = insights.reduce(
    (response: FLVResponse, insight) => {
      fetch(`/api/insights/${insight.uid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      }).then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
      });
      response.facts.push(insight);
      return response;
    },
    { action: -1, facts: [] },
  );
  return finalResponse;
};
