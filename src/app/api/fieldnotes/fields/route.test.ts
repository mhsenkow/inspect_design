/**
 * @jest-environment node
 */

import { FieldModel } from "../models/Fields";
import { GET, POST } from "./route";
import { DELETE } from "./[id]/route";
import { NextRequest } from "next/server";

jest.mock("../models/Fields", () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhereNull: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockFieldModelConstructor = jest.fn();
  Object.assign(MockFieldModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    FieldModel: MockFieldModelConstructor,
  };
});

const mockFields = [
  { id: 1, name: "Field1" },
  { id: 2, name: "Field2" },
];

describe("fieldnotes/fields routes", () => {
  describe("GET /", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (FieldModel.query().where as jest.Mock).mockReturnThis();
      (FieldModel.query().orWhereNull as jest.Mock).mockReturnThis();
      (FieldModel.query().groupBy as jest.Mock).mockReturnThis();
      (FieldModel.query().orderBy as jest.Mock).mockReturnThis();
      (FieldModel.query().then as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(callback(mockFields)),
      );
    });

    it("should return 200 with a list of fifelds", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({ offset: "0", limit: "2" }),
        },
      } as NextRequest;

      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual(mockFields);
    });
  });

  describe("POST /", () => {
    it("should return 400 when name is missing", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ statusText: "Name is required" });
    });

    it("should return 201 and create field with valid authentication and name", async () => {
      const localMockField = {
        name: "New Field",
      };

      (FieldModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback({
              ...localMockField,
              id: 1,
            }),
          ),
      );
      const req = {
        json: jest.fn().mockResolvedValue({
          name: "New Field",
        }),
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({
        ...localMockField,
        id: 1,
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a field and return 204", async () => {
      (FieldModel.query().andWhere as jest.Mock).mockResolvedValue(1);
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({ id: "1" }),
        },
      } as unknown as NextRequest;

      const res = await DELETE(req);

      expect(FieldModel.query().delete).toHaveBeenCalled();
      expect(FieldModel.query().where).toHaveBeenCalledWith("id", "1");
      expect(FieldModel.query().andWhere).toHaveBeenCalledWith("user_id", 1);
      expect(res.status).toBe(204);
    });
  });
});
