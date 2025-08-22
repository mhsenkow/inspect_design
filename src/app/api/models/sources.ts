import { Model } from "objection";

import { Source } from "../../types";

export class SourceModel extends Model implements Source {
  static tableName = "sources";

  id?: number;
  baseurl!: string;
  logo_uri!: string;

  static jsonSchema = {
    type: "object",
    required: ["baseurl"],
    properties: {
      id: { type: "integer" },
      baseurl: { type: "string" },
      logo_uri: { type: "string" },
    },
  };
}
