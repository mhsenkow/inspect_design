import Knex from "knex";
import { Model } from "objection";

declare global {
  var knexInstance: Knex.Knex;
}

let knexInstance: Knex.Knex;

if (!global.knexInstance || process.env.NODE_ENV === "development") {
  knexInstance = Knex({
    client: "pg",
    useNullAsDefault: true,
    connection: {
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
    },
    pool: {
      // min: 2, // TODO: do I need a minimum number of postgres connections?
      // max: 10,
      max: 5, // TODO: increase max connections/postgres processes once I have more users
      idleTimeoutMillis: 30000,
    },
  });

  Model.knex(knexInstance);

  global.knexInstance = knexInstance;
  console.log("Database connection initialized and bound to Objection.js.");
} else {
  knexInstance = global.knexInstance;
  console.log("Using existing database connection.");
}

export default knexInstance;
