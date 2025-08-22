import { Model, QueryBuilder, ref } from "objection";
import knex from "../db";

import { Insight, InsightEvidence, InsightLink } from "../../types";
import { CommentModel } from "./comments";
import { EvidenceModel } from "./evidence";
import { ReactionModel } from "./reactions";

export class InsightModel extends Model implements Insight {
  static tableName = "insights";

  id?: number;
  uid?: string;
  title!: string;
  is_public!: boolean;
  user_id!: number;

  static jsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer" },
      uid: { type: "string" },
      title: { type: "string" },
      is_public: { type: "boolean" },
    },
  };

  parents!: InsightLink[];
  children!: InsightLink[];
  evidence!: InsightEvidence[];

  static modifiers = {
    selectDisplayColumns(builder: QueryBuilder<InsightModel>) {
      builder.select(
        "insights.id",
        "insights.uid",
        "insights.created_at",
        "insights.updated_at",
        "insights.title",
      );
    },
    selectId(builder: QueryBuilder<InsightModel>) {
      builder.select("insights.id");
    },
    selectTotalEvidenceCount(builder: QueryBuilder<InsightModel>) {
      builder
        .withRecursive("insightHierarchy", (qb) => {
          // Anchor member: Select the current insight's ID and evidence count
          qb.select(
            "insights.id",
            // Directly count evidence for the current insight
            InsightModel.relatedQuery<EvidenceModel>("evidence")
              .count("id")
              .as("evidenceCount"),
            knex.raw("1 as depth"),
          )
            .from("insights")
            .where("insights.id", ref("insights.id")); // Reference the ID of the 'root' insight for which the modifier was called

          // Recursive member: Join through insight_links to find *child insights* and then their evidence counts
          qb.unionAll(
            InsightModel.query()
              .select(
                "child_insights.id", // Select the ID of the actual child insight
                InsightModel.relatedQuery<EvidenceModel>("evidence")
                  .for("child_insights")
                  .count("id")
                  .as("evidenceCount"), // Count evidence for the child insight
                knex.raw("ih.depth + 1 as depth"),
              )
              .from("insights as child_insights") // Alias to distinguish from parent insights
              .join("insight_links as il", "child_insights.id", "il.child_id") // Join child insights with the link table
              .join("insightHierarchy as ih", "il.parent_id", "ih.id") // Join link table with the recursive CTE (finding parents of current children)
              .where(knex.raw("ih.depth < 5")),
          );
        })
        .select(
          "insights.*", // Select all columns from the current insight
          knex.raw(
            "COALESCE(SUM(insightHierarchy.evidenceCount), 0) AS totalEvidenceCount",
          ),
        )
        .from("insights")
        .join("insightHierarchy as ih", "insights.id", "ih.id")
        .groupBy("insights.id");
    },
    selectDirectEvidenceCount(builder: QueryBuilder<InsightModel>) {
      builder.select(
        "insights.*",
        InsightModel.relatedQuery<EvidenceModel>("evidence")
          .count("*")
          .as("directEvidenceCount"),
      );
    },
  };

  static get relationMappings() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { InsightLinkModel } = require("./insight_links");
    return {
      parents: {
        relation: Model.HasManyRelation,
        modelClass: InsightLinkModel,
        join: {
          from: "insights.id",
          to: "insight_links.child_id",
        },
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: InsightLinkModel,
        join: {
          from: "insights.id",
          to: "insight_links.parent_id",
        },
      },
      reactions: {
        relation: Model.HasManyRelation,
        modelClass: ReactionModel,
        join: {
          from: "insights.id",
          to: "reactions.insight_id",
        },
      },
      comments: {
        relation: Model.HasManyRelation,
        modelClass: CommentModel,
        join: {
          from: "insights.id",
          to: "comments.insight_id",
        },
      },
      evidence: {
        relation: Model.HasManyRelation,
        modelClass: EvidenceModel,
        join: {
          from: "insights.id",
          to: "evidence.insight_id",
        },
      },
    };
  }
}
