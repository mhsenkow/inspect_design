/**
 * @jest-environment node
 */
import { cookies, headers } from "next/headers";

import InsightPage, { generateMetadata } from "./page";
import { getInsightFromServer, getUserFromServer } from "../../api/functions";

jest.mock("../../api/functions");
jest.mock("next/headers");
jest.mock("../functions");
jest.mock("./ClientSidePage");

describe("GET /insights/uid SSR page", () => {
  const mockHeaders = {
    get: jest.fn().mockImplementation((key) => {
      if (key == "x-origin") {
        return "origin";
      } else if (key == "x-authUser") {
        return JSON.stringify({ user_id: 1 });
      }
    }),
  };
  const mockCookies = {
    get: jest.fn().mockReturnValue({ value: "token" }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockReturnValue(mockHeaders);
    (cookies as jest.Mock).mockReturnValue(mockCookies);
  });

  it("should render the InsightPage with insight data", async () => {
    const mockInsight = {
      id: 1,
      uid: "123",
      title: "Test Insight",
      evidence: [],
      parent_uids: ["456"],
      children: [],
    };
    const mockUser = { id: 4 };

    (getInsightFromServer as jest.Mock).mockResolvedValueOnce(mockInsight);
    (getUserFromServer as jest.Mock).mockResolvedValue(mockUser);

    const result = await InsightPage({
      params: Promise.resolve({ uid: "123" }),
    });
    expect(result.props).toEqual({
      insightInput: mockInsight,
      currentUser: mockUser,
    });

    expect(getInsightFromServer).toHaveBeenCalledTimes(1);
    expect(getInsightFromServer).toHaveBeenCalledWith(
      "origin",
      { uid: "123" },
      "token",
    );
    expect(getUserFromServer).toHaveBeenCalledWith(
      "origin",
      { id: 1 },
      "token",
    );
  });

  it("should return an error message when the insight is not found via UID", async () => {
    (getInsightFromServer as jest.Mock).mockResolvedValue(null);

    const result = await InsightPage({
      params: Promise.resolve({ uid: "123" }),
    });

    expect(result.props).toEqual({
      children: "No insight with that UID found.",
    });

    expect(getInsightFromServer).toHaveBeenCalledWith(
      "origin",
      { uid: "123" },
      "token",
    );
  });
});

describe("generateMetadata", () => {
  const mockHeaders = {
    get: jest.fn().mockImplementation((key) => {
      if (key == "x-origin") {
        return "origin";
      } else if (key == "x-url") {
        return "http://localhost/insight/123";
      }
    }),
  };
  const mockCookies = {
    get: jest.fn().mockReturnValue({ value: "token" }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockReturnValue(mockHeaders);
    (cookies as jest.Mock).mockReturnValue(mockCookies);
  });

  it("should generate metadata for an insight", async () => {
    const mockInsight = {
      uid: "123",
      title: "Test Insight",
      evidence: [{ summary_id: 1 }, { summary_id: 2 }, { summary_id: 3 }],
      children: [],
    };

    (getInsightFromServer as jest.Mock).mockResolvedValue(mockInsight);
    mockHeaders.get
      .mockReturnValueOnce("http://localhost")
      .mockReturnValueOnce("http://localhost/insight/123");

    const metadata = await generateMetadata({
      params: Promise.resolve({ uid: "123" }),
    });

    expect(metadata).toEqual({
      openGraph: {
        url: "http://localhost/insight/123",
        type: "article",
        title: "Test Insight",
        description: `📄 3
`,
        images: "http://localhost/images/share_image.png",
        locale: "en_US",
      },
      twitter: {
        creator: "@bobstark",
      },
    });
  });

  it("should handle case when insight is not found", async () => {
    (getInsightFromServer as jest.Mock).mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ uid: "123" }),
    });

    expect(metadata).toBeUndefined();
  });
});
