import { QueryBuilder } from "objection";

import { User } from "../../types";
import libSqlKnexInstance from "../libsql";
import { LibSqlBaseModel } from "./libsql_models";
import postgresKnexInstance from "../postgres";
import { PostgresBaseModel } from "./postgres_models";

export class UserLibSqlModel extends LibSqlBaseModel implements User {
  static tableName = "users";

  id?: number;
  username!: string;
  email!: string;
  password?: string;
  passwordResetKey?: string | null;
  token?: string;

  static jsonSchema = {
    type: "object",
    required: ["username", "email"],
    properties: {
      id: { type: "integer" },
      username: { type: "string" },
      email: { type: "string" },
      passwordResetKey: { type: ["string", "null"] },
    },
  };

  static modifiers = {
    selectUsername(builder: QueryBuilder<UserLibSqlModel>) {
      builder.select("users.id", "users.username", "users.avatar_uri");
    },
  };

  // static get relationMappings() {
  //   return {
  //     // followers: {from: id, to: user_id },
  //   };
  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static query(...args: any[]) {
    if (!this.knex()) {
      this.knex(libSqlKnexInstance);
    }
    return super.query(...args);
  }
}

export class UserPostgresModel extends PostgresBaseModel implements User {
  static tableName = "users";

  id?: number;
  username!: string;
  email!: string;
  password?: string;
  passwordResetKey?: string | null;

  static jsonSchema = {
    type: "object",
    required: ["id", "username", "email"],
    properties: {
      id: { type: "integer" },
      username: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
      passwordResetKey: { type: ["string", "null"] },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static query(...args: any[]) {
    if (!this.knex()) {
      this.knex(postgresKnexInstance);
    }
    return super.query(...args);
  }
}
