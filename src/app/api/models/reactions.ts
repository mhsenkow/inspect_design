import { Model } from "objection";

import { FactReaction } from "../../types";
import { UserLibSqlModel } from "./users";
import { SummaryModel } from "./summaries";
import { PostgresBaseModel } from "./postgres_models";

export class ReactionModel extends PostgresBaseModel implements FactReaction {
  static tableName = "reactions";

  id?: number;
  reaction?: string;
  created_at?: string;
  updated_at?: string;

  static jsonSchema = {
    type: "object",
    required: ["reaction", "user_id"],
    properties: {
      id: { type: "integer" },
      reaction: { type: "string" },
      user_id: { type: "integer" },
      insight_id: { type: "integer" },
      summary_id: { type: "integer" },
    },
  };

  user_id!: number;
  insight_id?: number;
  summary_id?: number;

  static get relationMappings() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const InsightModel = require("./insights");
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: UserLibSqlModel,
        join: {
          from: "reactions.user_id",
          to: "users.id",
        },
      },
      insight: {
        relation: Model.HasOneRelation,
        modelClass: InsightModel,
        join: {
          from: "reactions.insight_id",
          to: "insights.id",
        },
      },
      summary: {
        relation: Model.HasOneRelation,
        modelClass: SummaryModel,
        join: {
          from: "reactions.summary_id",
          to: "summaries.id",
        },
      },
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
