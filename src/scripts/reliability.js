const { Client } = require("pg");
const dotenv = require("dotenv");

const getReliabilityRating = async (client, sourceId) => {
  // TODO: consider using an iterative approach like PageRank once I get a ton of data
  const result = await client.query({
    text: "select truth from summaries where source_id = $1::integer",
    values: [Number(sourceId)],
  });
  const summaryTruths = result.rows.map((row) => parseFloat(row.truth));
  // TODO: reconsider returning the average value
  const sum = summaryTruths.reduce((total, truth) => total + truth, 0);
  const avg = sum / summaryTruths.length;
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

  let requestedSourceIds;
  if (process.argv.length > 2) {
    requestedSourceIds = [...new Set(process.argv.splice(2))];
  } else {
    // TODO: there may be a way to do this better with a join
    const result = await client.query({
      text: "select id from sources s1 where (select count(*) from summaries s2 where s2.source_id = s1.id) > 0",
    });
    requestedSourceIds = result.rows.map((row) => row.id);
  }
  // TODO: refactor this to be more efficient with the async/waits; e.g., by having postgres do everything
  const reliabilityValues = await Promise.all(
    requestedSourceIds.map(async (sourceId) => {
      const reliability = await getReliabilityRating(client, sourceId);
      await client.query({
        text: "update sources set reliability = $1::decimal",
        values: [reliability],
      });
      return reliability;
    }),
  );
  console.log(
    reliabilityValues.map(
      (reliability, index) => `${requestedSourceIds[index]}: ${reliability}`,
    ),
  );
  await client.end();
};

main();
