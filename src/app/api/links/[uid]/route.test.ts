/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { GET } from "./route";
import { getPageHeaderImageUrl } from "./functions";
import { SummaryModel } from "../../models/summaries";
import { getAuthUser } from "../../../functions";

jest.mock("../../../functions");
jest.mock("../../functions");
jest.mock("./functions");

jest.mock("../../models/summaries", () => {
  const mockQueryBuilder = {
    findOne: jest.fn().mockReturnThis(),
    for: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    withGraphJoined: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
    whereInComposite: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockSummaryModelConstructor = jest.fn();
  Object.assign(MockSummaryModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    relatedQuery: jest.fn(() => mockQueryBuilder),
  });

  return {
    SummaryModel: MockSummaryModelConstructor,
  };
});

const resolveUserId = (userId: number | undefined) => {
  (getAuthUser as jest.Mock).mockResolvedValue(
    userId ? JSON.stringify({ user_id: userId }) : null,
  );
};

const mockSummary = {
  uid: "asdf",
  comments: [],
  reactions: [],
  shares: [],
  title: "new title",
  source: {
    logo_uri: "",
    baseurl: "",
  },
};

describe("/api/links/[uid]", () => {
  const doesNotExistSummary = { uid: "asdf", source_id: -1 };

  beforeEach(() => {
    (getPageHeaderImageUrl as jest.Mock).mockResolvedValue("avatar.png");
    jest.clearAllMocks();
    (SummaryModel.query().findOne as jest.Mock).mockReturnThis();
    (SummaryModel.query().for as jest.Mock).mockReturnThis();
    (SummaryModel.query().patch as jest.Mock).mockReturnThis();
    (SummaryModel.query().delete as jest.Mock).mockReturnThis();
    (SummaryModel.query().insert as jest.Mock).mockReturnThis();
    (SummaryModel.query().where as jest.Mock).mockReturnThis();
    (SummaryModel.query().onConflict as jest.Mock).mockReturnThis();
    (SummaryModel.query().merge as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphJoined as jest.Mock).mockReturnThis();
    (SummaryModel.query().withGraphFetched as jest.Mock).mockReturnThis();
    (SummaryModel.query().whereInComposite as jest.Mock).mockReturnThis();
    (SummaryModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockSummary)),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("GET returns 200 and the summary, including its references, when it exists", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(`http://localhost:8080/api/links/${mockSummary.uid}`),
      );

      const response = await GET(req, {
        params: Promise.resolve({ uid: mockSummary.uid }),
      });

      expect(response.status).toBe(200);

      const summary = await response.json();
      expect(summary).toEqual(mockSummary);
      expect(summary.source).toEqual(mockSummary.source);
      expect(summary.comments).toEqual(mockSummary.comments);
      expect(summary.reactions).toEqual(mockSummary.reactions);
    });

    it("GET returns 200 and the summary without imageUrl when getPageHeaderImageUrl fails", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(`http://localhost:8080/api/links/${mockSummary.uid}`),
      );

      (getPageHeaderImageUrl as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await GET(req, {
        params: Promise.resolve({ uid: mockSummary.uid }),
      });

      expect(response.status).toBe(200);

      const summary = await response.json();
      expect(summary.imageUrl).toBeUndefined();
    });

    it("GET returns 200 and the summary with imageUrl when getPageHeaderImageUrl succeeds", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(`http://localhost:8080/api/links/${mockSummary.uid}`),
      );

      (getPageHeaderImageUrl as jest.Mock).mockResolvedValue("image_url");

      const response = await GET(req, {
        params: Promise.resolve({ uid: mockSummary.uid }),
      });

      expect(response.status).toBe(200);

      const summary = await response.json();
      expect(summary.imageUrl).toBe("image_url");
    });

    it("GET returns 404 when summary does not exist", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(
          `http://localhost:8080/api/links/${doesNotExistSummary.uid}`,
        ),
      );
      (SummaryModel.query().then as jest.Mock).mockReset();
      (SummaryModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(null)),
      );

      const response = await GET(req, {
        params: Promise.resolve({ uid: doesNotExistSummary.uid }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.message).toEqual("No summary with that uid found");
    });
  });
});
