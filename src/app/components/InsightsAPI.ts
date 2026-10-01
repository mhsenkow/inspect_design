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
        .then(async (response: Response | PostInsightsRouteResponse) => {
          if (!response.ok) {
            let message = response.statusText || "Request failed";
            try {
              const err = await response.json();
              message = err.message || err.statusText || message;
            } catch {
              /* ignore parse errors */
            }
            throw new Error(message);
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
    .then(async (response) => {
      const text = await response.text();
      let body: Partial<Insight> & { statusText?: string; message?: string } =
        {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          /* ignore */
        }
      }
      if (!response.ok) {
        throw new Error(
          body.message ||
            body.statusText ||
            response.statusText ||
            "Unable to update insight",
        );
      }
      return body as Partial<Insight>;
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
  options: { cascade?: boolean } = {},
): Promise<FLVResponse> => {
  const cascadeQuery = options.cascade ? "?cascade=1" : "";
  // Must await each DELETE before returning — otherwise callers that navigate
  // away (e.g. window.location) abort the request and the insight "comes back".
  await Promise.all(
    insights.map(async (insight) => {
      const response = await fetch(
        `/api/insights/${insight.uid}${cascadeQuery}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
        },
      );
      if (!response.ok) {
        let message = response.statusText || "Unable to delete insight";
        try {
          const err = (await response.json()) as {
            statusText?: string;
            message?: string;
          };
          message = err.message || err.statusText || message;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(message);
      }
    }),
  );

  return { action: -1, facts: insights };
};
