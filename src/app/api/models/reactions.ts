import { Model } from "objection";

import { FactReaction } from "../../types";
import { UserModel } from "./users";
import { SummaryModel } from "./summaries";

export class ReactionModel extends Model implements FactReaction {
  static tableName = "reactions";

  id?: number;
  reaction!: string;

  static jsonSchema = {
    type: "object",
    required: ["reaction", "user_id"],
    properties: {
      id: { type: "integer" },
      reaction: { type: "string" },
      user_id: { type: "integer" },
      insight_id: { type: "integer" },
      summary_id: { type: "integer" },
      comment_id: { type: "integer" },
    },
  };

  user_id!: number;
  insight_id?: number;
  summary_id?: number;
  comment_id?: number;

  static get relationMappings() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const InsightModel = require("./insights");
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: UserModel,
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
}
