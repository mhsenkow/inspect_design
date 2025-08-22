const { Client } = require("pg");
const dotenv = require("dotenv");

const main = async () => {
  dotenv.config();

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

  const allIdsResult = await client.query({
    text: "select id from summaries order by id",
  });
  const allIds = allIdsResult.rows.map((row) => row.id);

  const favoriteIdsResult = await client.query({
    text: "select id from favorites order by id",
  });
  const favoriteIds = favoriteIdsResult.rows.map((row) => row.id);

  const idsToUpdateNotFavorites = allIds.filter(
    (id) => !favoriteIds.includes(id),
  );

  await Promise.all(
    idsToUpdateNotFavorites.map((id) =>
      client
        .query({
          text: "update summaries set is_public = true where id = $1::integer",
          values: [Number(id)],
        })
        .then(() => {
          console.log(`Updated summary #${id} is_public to true`);
        }),
    ),
  );

  await client.query("drop table favorites");

  await client.end();
};

main();
