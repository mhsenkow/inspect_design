import { Model, QueryBuilder } from "objection";

import { FactComment } from "../../types";
import { UserLibSqlModel } from "../models/users";
import { PostgresBaseModel } from "./postgres_models";

export class CommentModel extends PostgresBaseModel implements FactComment {
  static tableName = "comments";

  user!: UserLibSqlModel;
  username!: string;
  id?: number;
  comment!: string;
  summary_id?: number;
  insight_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;

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
      modelClass: UserLibSqlModel,
      join: {
        from: "comments.user_id",
        to: "users.id",
      },
    },
  };

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
