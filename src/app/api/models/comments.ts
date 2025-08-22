import { Model, QueryBuilder } from "objection";

import { FactComment } from "../../types";
import { UserModel } from "../models/users";

export class CommentModel extends Model implements FactComment {
  static tableName = "comments";

  user!: UserModel;
  username!: string;
  id?: number;
  comment!: string;
  summary_id?: number;
  insight_id?: number;
  user_id?: number;

  static jsonSchema = {
    type: "object",
    required: ["comment", "user_id"],
    properties: {
      id: { type: "integer" },
      comment: { type: "string" },
      user_id: { type: "integer" },
      insight_id: { type: "integer" },
      summary_id: { type: "integer" },
    },
  };

  static modifiers = {
    selectDisplayAndUserJoinColumn(builder: QueryBuilder<CommentModel>) {
      builder.select(
        "comments.id",
        "comments.created_at",
        "comments.summary_id",
        "comments.insight_id",
        "comments.comment",
        "comments.user_id",
      );
    },
  };

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: "comments.user_id",
        to: "users.id",
      },
    },
  };
}
