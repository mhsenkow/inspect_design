/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { GET } from "./route";
import { SourceModel } from "../../models/sources";
import { getAuthUser } from "../../../functions";

jest.mock("../../../functions");

jest.mock("../../models/sources", () => {
  const mockQueryBuilder = {
    findOne: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockSourceModelConstructor = jest.fn();
  Object.assign(MockSourceModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    relatedQuery: jest.fn(() => mockQueryBuilder),
  });

  return {
    SourceModel: MockSourceModelConstructor,
  };
});

const resolveUserId = (userId: number | undefined) => {
  (getAuthUser as jest.Mock).mockResolvedValue(
    userId ? JSON.stringify({ user_id: userId }) : null,
  );
};

const mockSource = {
  logo_uri: "",
  baseurl: "",
};

describe("/api/sources/[baseurl]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SourceModel.query().findOne as jest.Mock).mockReturnThis();
    (SourceModel.query().then as jest.Mock).mockImplementation((callback) =>
      Promise.resolve(callback(mockSource)),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("GET returns 200 and the source when it exists", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(`http://localhost:8080/api/sources/${mockSource.baseurl}`),
      );

      const response = await GET(req, {
        params: Promise.resolve(mockSource),
      });

      expect(response.status).toBe(200);

      const source = await response.json();
      expect(source).toEqual(mockSource);
    });

    it("GET returns 404 when the source does not exist based on baseurl", async () => {
      resolveUserId(2);
      const req = new NextRequest(
        new Request(`http://localhost:8080/api/sources/does-not-exist`),
      );
      (SourceModel.query().then as jest.Mock).mockReset();
      (SourceModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) => Promise.resolve(callback(null)),
      );

      const response = await GET(req, {
        params: Promise.resolve({ baseurl: "does-not-exist" }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.message).toEqual("No such source");
    });
  });
});
