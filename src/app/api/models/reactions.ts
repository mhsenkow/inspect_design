import { Model } from "objection";

import { FactReaction } from "../../types";

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

  // Relation mappings removed to prevent circular dependency issues
  // static get relationMappings() { ... }
}
