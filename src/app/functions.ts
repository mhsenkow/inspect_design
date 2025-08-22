import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import {
  DeleteCommentRouteProps,
  DeleteCommentRouteResponse,
} from "./api/comments/[id]/route";
import {
  PostCommentRequestBody,
  PostCommentResponse,
} from "./api/comments/route";
import { PostRequestRouteRequestBody } from "./api/reactions/route";
import {
  AuthUser,
  FactComment,
  FactReaction,
  Indexable,
  Insight,
  InsightEvidence,
  Link,
} from "./types";
import { SortDir } from "./components/FactsTable";

export const getUnreadSummariesForCurrentUser = (
  origin: string,
  offset: number,
  token: string,
): Promise<Link[]> =>
  fetch(`${origin}/api/unread_summaries?offset=${offset}&limit=${20}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then((response) => response.json());

export const submitComment = async (
  requestBody: Awaited<PostCommentRequestBody>,
  token: string,
): Promise<FactComment | void> => {
  const response = (await fetch("/api/comments", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })) as PostCommentResponse;
  if (response.status == 200) {
    return await response.json();
  } else {
    const textObject = await response.json();
    alert(textObject.message || response.statusText);
  }
};

export const deleteComment = async (
  params: Awaited<DeleteCommentRouteProps["params"]>,
  token: string,
): Promise<boolean> => {
  const response = (await fetch(`/api/comments/${params.id!}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })) as DeleteCommentRouteResponse;
  if (response.status == 200) {
    return true;
  } else {
    throw await response.json();
  }
};

// const percentageToHsl = (
//   percentage: number,
//   hue0: number = 120,
//   hue1: number = 0,
// ): string => {
//   const hue = percentage * (hue0 - hue1) + hue1;
//   return "hsl(" + hue + ", 100%, 50%)";
// };

export const submitReaction = (
  requestBody: Awaited<PostRequestRouteRequestBody>,
  token: string,
): Promise<FactReaction | void> =>
  fetch("/api/reactions", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then(async (response) => {
    // TODO: add PostReactionRouteResponse type to response if I can debug its ts error
    if (response.status == 200) {
      return await response.json();
    } else {
      const textObject = await response.json();
      alert(textObject.message || response.statusText);
    }
  });

const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export function debounce({
  func,
  key = "default",
  wait = 300,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  func: Function;
  key?: string;
  wait?: number;
}) {
  if (timeouts[key]) {
    clearTimeout(timeouts[key]);
  }
  timeouts[key] = setTimeout(() => {
    func();
  }, wait);
}

export const getDisabledInsightIds = (
  potentialInsights: Insight[],
  selectedCitations: InsightEvidence[],
): number[] => {
  if (selectedCitations.length > 0) {
    const disabledInsights: Insight[] = selectedCitations.reduce(
      (insights: Insight[], citation: InsightEvidence) => {
        const existingInsights = potentialInsights.filter((i) => {
          return i.evidence
            ? i.evidence.map((e) => e.summary_id).includes(citation.summary_id)
            : false;
        });
        insights.push(...existingInsights);
        return insights;
      },
      [] as Insight[],
    );
    return disabledInsights.map((i) => i.id ?? 0);
  }
  return [];
};

export const getAuthUser = async (headers: () => Promise<ReadonlyHeaders>) => {
  const authUserString = (await headers()).get("x-authUser");
  return authUserString ? (JSON.parse(authUserString) as AuthUser) : null;
};

export const getColumnName = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  ...possibilities: string[]
): undefined | string => {
  if (data) {
    const columns = Object.keys(data[0]);
    for (const possibility of possibilities) {
      if (columns.includes(possibility)) {
        return possibility;
      }
    }
  }
  return undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const areSameType = (a: any, b: any) => typeof a == typeof b && typeof a;

export const getSortFunction =
  <T extends Indexable>(sortDir?: SortDir) =>
  (a: T, b: T): number => {
    if (sortDir) {
      let aValue = a[sortDir.column];
      let bValue = b[sortDir.column];

      if (sortDir.column.includes(".")) {
        const parts = sortDir.column.split(".");
        aValue = parts.reduce((prev, current) => {
          return prev && prev[current] !== undefined
            ? prev[current]
            : undefined;
        }, a);
        bValue = parts.reduce((prev, current) => {
          return prev && prev[current] !== undefined
            ? prev[current]
            : undefined;
        }, b);
      }

      if (aValue !== undefined && bValue !== undefined) {
        if (sortDir.dir == "asc") {
          if (
            areSameType(aValue, bValue) == "number" ||
            areSameType(aValue, bValue) == "boolean"
          ) {
            return Number(aValue) - Number(bValue);
          } else if (typeof aValue == "string") {
            return aValue.localeCompare(bValue);
          } else if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
            return Date.parse(aValue) - Date.parse(bValue);
          } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
            return aValue.length - bValue.length;
          }
        } else {
          if (
            areSameType(aValue, bValue) == "number" ||
            areSameType(aValue, bValue) == "boolean"
          ) {
            return Number(bValue) - Number(aValue);
          } else if (typeof aValue == "string") {
            return bValue.localeCompare(aValue);
          } else if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
            return Date.parse(bValue) - Date.parse(aValue);
          } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
            return bValue.length - aValue.length;
          }
        }
      }
    }
    return 0;
  };
