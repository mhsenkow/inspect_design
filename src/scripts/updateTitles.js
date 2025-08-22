import pg from "pg";
const { Client } = pg;
import dotenv from "dotenv";
import { decode as decodeHTML } from "html-entities";

const getPageMetaTitle = (html) => {
  const metaTagMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+>/i);
  const valueMatch = metaTagMatch[0].match(/content=["']([^"']+)["']/i);
  if (valueMatch && valueMatch[1]) {
    return decodeHTML(valueMatch[1]);
  }
};

export const getPageTitle = async (url) => {
  console.log("\tgetting updated title for: ", url);
  const result = await fetch("http://localhost:3000/api/articles", {
    method: "POST",
    headers: { "Content-Type": "text/html" },
    body: JSON.stringify({ url }),
  });
  const json = await result.json();
  const html = json.html;
  const metaTitle = getPageMetaTitle(html);
  if (metaTitle) {
    return metaTitle;
  }
  throw new Error("Summary title not found for: " + url);
};

async function updateTitles(id) {
  dotenv.config();
  const client = new Client({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    let summaries;
    if (id) {
      const res = await client.query({
        text: "SELECT * FROM summaries WHERE id = $1::integer",
        values: [id],
      });
      summaries = res.rows;
    } else {
      const res = await client.query({
        text: "SELECT * FROM summaries ORDER BY id ASC",
      });
      summaries = res.rows;
    }

    for (let index = 0; index < summaries.length; index++) {
      const summary = summaries[index];
      try {
        const newTitle = await getPageTitle(summary.url);
        if (newTitle && newTitle !== summary.title) {
          await client.query("UPDATE summaries SET title = $1 WHERE id = $2", [
            newTitle,
            summary.id,
          ]);
        }
      } catch (err) {
        console.error(`\tError updating title for summary #${index + 1}`);
        // console.error(`Error details: ${err.stack}`);
        continue;
      }
    }
  } catch (err) {
    console.error("Error updating titles:", err);
  } finally {
    await client.end();
  }
}

updateTitles(process.argv[2]);
