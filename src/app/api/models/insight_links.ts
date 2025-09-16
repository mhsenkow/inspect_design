import { Model, QueryBuilder } from "objection";
import { InsightLink } from "../../types";
import { InsightModel } from "./insights";

export class InsightLinkModel extends Model implements InsightLink {
  static tableName = "insight_links";

  id?: number;
  parent_id!: number;
  child_id!: number;

  static jsonSchema = {
    type: "object",
    required: ["child_id", "parent_id"],
    properties: {
      id: { type: "integer" },
      child_id: { type: "integer" },
      parent_id: { type: "integer" },
    },
  };

  parentInsight?: InsightModel;
  childInsight?: InsightModel;

  static modifiers = {
    selectDirectChildrenCount(builder: QueryBuilder<InsightLinkModel>) {
      builder.count("*").as("directChildrenCount");
    },
  };

  static get relationMappings() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { InsightModel } = require("./insights");
    return {
      parentInsight: {
        relation: Model.BelongsToOneRelation,
        modelClass: InsightModel,
        join: {
          from: "insight_links.parent_id",
          to: "insights.id",
        },
      },
      childInsight: {
        relation: Model.BelongsToOneRelation,
        modelClass: InsightModel,
        join: {
          from: "insight_links.child_id",
          to: "insights.id",
        },
      },
    };
  }
}
