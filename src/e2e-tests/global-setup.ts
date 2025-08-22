// const dotenv = require("dotenv");
// const { Client } = require("pg");
// const bcrypt = require("bcryptjs");

module.exports = async () => {
  // dotenv.config({ path: "./.env", quiet: true });
  // const client = new Client({
  //   user: process.env.DATABASE_USER,
  //   password: process.env.DATABASE_PASSWORD,
  //   host: process.env.DATABASE_HOST,
  //   port: process.env.DATABASE_PORT,
  //   database: "inspect",
  // });
  // await client.connect();
  // await client.query({
  //   text: `insert into users (email, username, password)
  //         values ('test@test.com', 'Test2', $1::text)`,
  //   // on conflict (email) do update set id=excluded.id`,
  //   values: [await bcrypt.hash("asdf", 10)],
  // });
  // await client.end();
};
