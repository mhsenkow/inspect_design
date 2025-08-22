import { Model, QueryBuilder } from "objection";

import { User } from "../../types";

export class UserModel extends Model implements User {
  static tableName = "users";

  id?: number;
  username!: string;
  email!: string;
  password?: string;
  token?: string;

  static jsonSchema = {
    type: "object",
    required: ["username", "email"],
    properties: {
      id: { type: "integer" },
      username: { type: "string" },
      email: { type: "string" },
    },
  };

  static modifiers = {
    selectUsername(builder: QueryBuilder<UserModel>) {
      builder.select("users.id", "users.username", "users.avatar_uri");
    },
  };

  // static get relationMappings() {
  //   return {
  //     // followers: {from: id, to: user_id },
  //   };
  // }
}
