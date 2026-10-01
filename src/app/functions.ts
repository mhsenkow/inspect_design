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
  FactComment,
  FactReaction,
  Indexable,
  Insight,
  InsightEvidence,
  Link,
  User,
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

async function readResponseJson<T = unknown>(
  response: Response,
): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function errorMessageFromBody(
  body: { message?: string; statusText?: string } | null,
  fallback: string,
): string {
  return body?.message || body?.statusText || fallback;
}

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

  const body = await readResponseJson<
    FactComment | { message?: string; statusText?: string }
  >(response);

  if (response.ok && body && "comment" in body) {
    return body as FactComment;
  }

  throw new Error(
    errorMessageFromBody(
      body as { message?: string; statusText?: string } | null,
      response.statusText || "Unable to save comment.",
    ),
  );
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
  if (response.ok) {
    return true;
  }
  const body = await readResponseJson<{
    message?: string;
    statusText?: string;
  }>(response);
  throw new Error(
    errorMessageFromBody(
      body,
      response.statusText || "Unable to delete comment.",
    ),
  );
};

export const submitReaction = async (
  requestBody: Awaited<PostRequestRouteRequestBody>,
  token: string,
): Promise<FactReaction | void> => {
  const response = await fetch("/api/reactions", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });

  const body = await readResponseJson<
    FactReaction | { message?: string; statusText?: string }
  >(response);

  if (response.ok && body && "reaction" in body) {
    return body as FactReaction;
  }

  throw new Error(
    errorMessageFromBody(
      body as { message?: string; statusText?: string } | null,
      response.statusText || "Unable to save reaction.",
    ),
  );
};
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
  return authUserString ? (JSON.parse(authUserString) as User) : null;
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
