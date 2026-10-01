import { Source } from "../../types";
import { PostgresBaseModel } from "./postgres_models";

export class SourceModel extends PostgresBaseModel implements Source {
  static tableName = "sources";

  id?: number;
  baseurl!: string;
  logo_uri!: string;
  created_at?: string;
  updated_at?: string;

  static jsonSchema = {
    type: "object",
    required: ["baseurl"],
    properties: {
      id: { type: "integer" },
      baseurl: { type: "string" },
      logo_uri: { type: "string" },
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
