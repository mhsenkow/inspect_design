import { Model, QueryBuilder } from "objection";

import {
  Link,
  FactReaction,
  FactComment,
  EvidenceRecord,
  Source,
} from "../../types";
import { SourceModel } from "../models/sources";
import { CommentModel } from "./comments";
import { ReactionModel } from "./reactions";

export class SummaryModel extends Model implements Link {
  static tableName = "summaries";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id?: number;
  uid?: string;
  title!: string;
  reactions!: FactReaction[];
  comments!: FactComment[];
  evidence!: EvidenceRecord[];
  created_at!: string | undefined;
  url!: string;
  imageUrl?: string;
  logo_uri?: string;
  source_baseurl?: string;
  updated_at?: string | undefined;
  source!: Source;

  static jsonSchema = {
    type: "object",
    required: ["title", "url", "source_id"],
    properties: {
      id: { type: "integer" },
      title: { type: "string" },
      url: { type: "string" },
      source_id: { type: "integer" },
    },
  };

  static modifiers = {
    selectDisplayAndSourceJoinColumn(builder: QueryBuilder<SummaryModel>) {
      builder.select(
        "summaries.id",
        "summaries.updated_at",
        "summaries.title",
        "summaries.uid",
        "summaries.source_id",
      );
    },
  };

  // source!: SourceModel;
  // updated_at!: string;

  static get relationMappings() {
    return {
      source: {
        relation: Model.BelongsToOneRelation,
        modelClass: SourceModel,
        join: {
          from: "summaries.source_id",
          to: "sources.id",
        },
      },
      comments: {
        relation: Model.HasManyRelation,
        modelClass: CommentModel,
        join: {
          from: "summaries.id",
          to: "comments.summary_id",
        },
      },
      reactions: {
        relation: Model.HasManyRelation,
        modelClass: ReactionModel,
        join: {
          from: "summaries.id",
          to: "reactions.summary_id",
        },
      },
    };
  }
}
