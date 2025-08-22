const { Client } = require("pg");
const dotenv = require("dotenv");
const { Summary } = require("./types");

const getTruthRating = async (client, truth, citations) => {
  let avg = 0;
  // TODO: debug this once I implement citations/meta-summaries
  if (citations) {
    // TODO: consider using an iterative approach like PageRank once I get lots of data
    const result = await client.query({
      text: `select * from summaries where id in (${citations.join(",")})`,
    });
    const citationTruths = result.rows.map((row) => row.truth);
    // TODO: reconsider returning the average value
    const sum = citationTruths.reduce((total, truth) => total + truth, truth);
    avg = sum / (citationTruths.length + 1);
  } else {
    avg = truth;
  }
  return avg;
};

const main = async () => {
  dotenv.config({ path: "../.env", quiet: true }); // server

  const client = new Client({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    idleTimeoutMillis: 10000, // 10000 is default
    connectionTimeoutMillis: 2000, // 0 (no timeout!) is default
  });

  await client.connect();

  let requestedSummaries;
  if (process.argv.length > 2) {
    const reqIds = process.argv.splice(2);
    const result = await client.query({
      text: `select * from summaries where id in (${reqIds.join(",")})`,
    });
    requestedSummaries = result.rows.map((row) => new Summary(row));
  } else {
    requestedSummaries = await client
      .query({
        text: "select * from summaries",
      })
      .rows.map((row) => new Summary(row));
  }
  const truthValues = await Promise.all(
    requestedSummaries.map((summary) =>
      getTruthRating(client, summary.truth, summary.citations),
    ),
  );
  // TODO: update all values in db
  console.log(truthValues.join(","));
  await client.end();
};

main();
