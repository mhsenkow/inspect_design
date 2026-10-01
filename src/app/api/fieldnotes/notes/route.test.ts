/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "./route";
import { PATCH, DELETE } from "./[id]/route";
import { NoteModel } from "../models/notes";
import * as AppFunctions from "../../../functions";

jest.mock("../models/notes", () => {
  const mockQueryBuilder = {
    insertAndFetch: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn(),
    first: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    deleteById: jest.fn().mockReturnThis(),
  };

  return {
    NoteModel: {
      query: jest.fn(() => mockQueryBuilder),
    },
  };
});

jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));

const mockUser = { id: 1, email: "test@example.com", username: "tester" };

describe("notes routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppFunctions.getAuthUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /", () => {
    it("should fetch notes for the authenticated user", async () => {
      const fakeNotes = [{ id: 1, text: "Test note" }];
      (NoteModel.query().withGraphFetched as jest.Mock).mockResolvedValue(
        fakeNotes,
      );

      const res = await GET();

      expect(NoteModel.query().where).toHaveBeenCalledWith(
        "user_id",
        mockUser.id,
      );
      expect(NoteModel.query().withGraphFetched).toHaveBeenCalledWith(
        "field_values",
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(fakeNotes);
    });

    it("should return 401 if user is not authenticated", async () => {
      (AppFunctions.getAuthUser as jest.Mock).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe("POST /", () => {
    it("should create a new note and return 201", async () => {
      const newNoteData = { text: "A new note" };
      const createdNote = { ...newNoteData, id: 2, user_id: mockUser.id };
      (NoteModel.query().insertAndFetch as jest.Mock).mockResolvedValue(
        createdNote,
      );

      const req = {
        json: jest.fn().mockResolvedValue(newNoteData),
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(NoteModel.query().insertAndFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          text: newNoteData.text,
          user_id: mockUser.id,
        }),
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual(createdNote);
    });
  });

  describe("PATCH /[id]", () => {
    it("should update a note and return it", async () => {
      const noteId = "1";
      const updates = { text: "Updated text" };
      const updatedNote = { id: 1, ...updates };
      (NoteModel.query().returning as jest.Mock).mockResolvedValue(updatedNote);

      const req = {
        json: jest.fn().mockResolvedValue(updates),
      } as unknown as NextRequest;

      const res = await PATCH(req, { params: Promise.resolve({ id: noteId }) });

      expect(NoteModel.query().patch).toHaveBeenCalledWith(updates);
      expect(NoteModel.query().where).toHaveBeenCalledWith({
        id: parseInt(noteId, 10),
        user_id: mockUser.id,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(updatedNote);
    });

    it("should return 404 if note not found", async () => {
      (NoteModel.query().returning as jest.Mock).mockResolvedValue(undefined);

      const req = {
        json: jest.fn().mockResolvedValue({ text: "update" }),
      } as unknown as NextRequest;

      const res = await PATCH(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /[id]", () => {
    it("should delete a note and return 204", async () => {
      const noteId = "1";
      (NoteModel.query().deleteById as jest.Mock).mockReturnThis();
      (NoteModel.query().where as jest.Mock).mockResolvedValue(1);

      const res = await DELETE({} as NextRequest, {
        params: Promise.resolve({ id: noteId }),
      });

      expect(NoteModel.query().deleteById).toHaveBeenCalledWith(noteId);
      expect(NoteModel.query().where).toHaveBeenCalledWith(
        "user_id",
        mockUser.id,
      );
      expect(res.status).toBe(204);
    });
  });
});
