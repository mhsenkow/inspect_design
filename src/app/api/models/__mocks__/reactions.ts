/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from "@jest/globals";
import { QueryResult } from "pg";

type RawFunctionReturnType = Promise<QueryResult<any>>;

type RawBindings = Record<string, any> | undefined;

export const mockRaw =
  jest.fn<(sql: string, bindings?: RawBindings) => RawFunctionReturnType>();

const MockReactionModel = {
  knex: jest.fn(() => ({
    raw: mockRaw,
  })),
};

export const ReactionModel = MockReactionModel;
