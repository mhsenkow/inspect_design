import { Model, QueryBuilder } from "objection";

import { EvidenceRecord } from "../../types";
import { SummaryModel } from "../models/summaries";
import { InsightModel } from "./insights";

export class EvidenceModel extends Model implements EvidenceRecord {
  static tableName = "evidence";

  id?: number;
  summary_id?: number;
  insight_id?: number;

  // static idColumn = ["summary_id", "insight_id"];

  summary!: SummaryModel;
  title!: string;
  uid?: string;
  // logo_uri!: number;
  // updated_at!: string;
  // source_baseurl!: string;

  static jsonSchema = {
    type: "object",
    required: ["summary_id", "insight_id"],
    properties: {
      id: { type: "integer" },
      summary_id: { type: "integer" },
      insight_id: { type: "integer" },
      logo_uri: { type: "string" },
      source_baseurl: { type: "string" },
    },
  };

  static modifiers = {
    selectDisplayAndSummaryJoinColumn(builder: QueryBuilder<EvidenceModel>) {
      builder.select(
        "evidence.id",
        "evidence.insight_id",
        "evidence.summary_id",
      );
    },
    selectSummaryId(builder: QueryBuilder<EvidenceModel>) {
      builder.select("evidence.summary_id");
    },
    selectPagedEvidence(
      builder: QueryBuilder<EvidenceModel>,
      offset: number,
      limit: number,
    ) {
      builder.skipUndefined().offset(offset).limit(limit);
    },
  };

  static get relationMappings() {
    return {
      summary: {
        relation: Model.BelongsToOneRelation,
        modelClass: SummaryModel,
        join: {
          from: "evidence.summary_id",
          to: "summaries.id",
        },
      },
      insight: {
        relation: Model.BelongsToOneRelation,
        modelClass: InsightModel,
        join: {
          from: "evidence.insight_id",
          to: "insights.id",
        },
      },
    };
  }
}
