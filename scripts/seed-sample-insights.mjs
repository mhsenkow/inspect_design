#!/usr/bin/env node
/**
 * Seed realistic sample insights for local UI exploration.
 * Usage: node scripts/seed-sample-insights.mjs [userId]
 * Default userId: 3 (mhsenkow@gmail.com in local sqlite)
 */
import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const userId = Number(process.argv[2] || 3);
const uid = () => `seed${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const roots = [
  "Climate policy needs better evidence pipelines",
  "Local journalism is civic infrastructure",
  "Product discovery should feel calm, not noisy",
  "AI summaries still need human verification loops",
  "Open data unlocks neighborhood advocacy",
  "Trust online depends on source provenance",
  "Mobile-first research tools change who can participate",
  "Community notes work best when tied to primary sources",
];

const childrenByRoot = [
  [
    "Satellite monitoring can close reporting gaps in remote regions",
    "Municipal dashboards rarely surface uncertainty clearly",
    "Citizen science programs need durable funding, not one-off grants",
  ],
  [
    "News deserts correlate with lower civic participation",
    "Public radio archives are underused research assets",
    "Small newsrooms benefit from shared verification tooling",
  ],
  [
    "Dense dashboards overwhelm first-time researchers",
    "Thumb-zone actions make capture feel effortless",
    "Search should stay subordinate to the user's question",
  ],
  [
    "Model confidence scores are often misread as truth",
    "Citation trails should be one tap away from any claim",
    "Editors still outperform models at spotting missing context",
  ],
  [
    "Parcel data reveals housing equity patterns",
    "Transit APIs enable hyperlocal advocacy maps",
    "Budget PDFs remain the hardest open-data problem",
  ],
  [
    "Domain logos help people recognize familiar outlets",
    "Anonymous tips need stronger corroboration rituals",
    "Provenance metadata should survive resharing",
  ],
  [
    "Offline-capable notes expand fieldwork access",
    "Gestural navigation lowers literacy barriers",
    "Voice capture is useful when typing is impractical",
  ],
  [
    "Community annotations drift without source anchors",
    "Disagreement is useful when evidence is linked",
  ],
];

const evidenceTitles = [
  ["How local newsrooms verify climate claims", "https://www.npr.org/seed-climate-verify"],
  ["Open data and neighborhood power", "https://www.propublica.org/seed-open-data"],
  ["Designing calm research tools", "https://www.boingboing.net/seed-calm-tools"],
  ["Uncertainty in public health reporting", "https://www.ncbi.nlm.nih.gov/seed-uncertainty"],
  ["What happens when towns lose their paper", "https://www.cnn.com/seed-news-deserts"],
  ["Provenance standards for shared media", "https://www.npr.org/seed-provenance"],
  ["Citizen science funding models", "https://www.propublica.org/seed-citizen-science"],
  ["Mobile fieldwork for civic research", "https://www.boingboing.net/seed-mobile-field"],
  ["Reading confidence scores carefully", "https://www.ncbi.nlm.nih.gov/seed-confidence"],
  ["Transit data for advocacy maps", "https://www.propublica.org/seed-transit"],
  ["Why citation trails matter", "https://www.npr.org/seed-citations"],
  ["Budget transparency beyond PDFs", "https://www.cnn.com/seed-budgets"],
];

const comments = [
  "This maps cleanly to the network view — worth expanding.",
  "Strong claim; needs one more primary source.",
  "Useful framing for the mobile dock experiments.",
  "Would pair well with the open-data cluster.",
];

const client = new pg.Client({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME,
});

await client.connect();

try {
  await client.query("BEGIN");

  // Clear prior seed rows for this user (keep non-seed insights)
  const prior = await client.query(
    `SELECT id FROM insights WHERE user_id = $1 AND uid LIKE 'seed%'`,
    [userId],
  );
  const priorIds = prior.rows.map((r) => r.id);
  if (priorIds.length) {
    await client.query(
      `DELETE FROM insight_links WHERE parent_id = ANY($1) OR child_id = ANY($1)`,
      [priorIds],
    );
    await client.query(`DELETE FROM evidence WHERE insight_id = ANY($1)`, [priorIds]);
    await client.query(`DELETE FROM comments WHERE insight_id = ANY($1)`, [priorIds]);
    await client.query(`DELETE FROM reactions WHERE insight_id = ANY($1)`, [priorIds]);
    await client.query(`DELETE FROM insights WHERE id = ANY($1)`, [priorIds]);
  }

  // Ensure a few sources exist
  const sourceRows = [];
  for (const baseurl of ["npr.org", "propublica.org", "cnn.com", "boingboing.net", "ncbi.nlm.nih.gov"]) {
    const existing = await client.query(`SELECT id FROM sources WHERE baseurl = $1`, [baseurl]);
    if (existing.rows[0]) {
      sourceRows.push(existing.rows[0].id);
    } else {
      const inserted = await client.query(
        `INSERT INTO sources (baseurl, logo_uri) VALUES ($1, $2) RETURNING id`,
        [baseurl, `https://logo.clearbit.com/${baseurl}`],
      );
      sourceRows.push(inserted.rows[0].id);
    }
  }

  const rootIds = [];
  for (let i = 0; i < roots.length; i++) {
    const title = roots[i];
    const res = await client.query(
      `INSERT INTO insights (user_id, uid, title, created_at, updated_at, is_public)
       VALUES ($1, $2, $3, NOW() - ($4 || ' days')::interval, NOW() - ($5 || ' hours')::interval, $6)
       RETURNING id`,
      [userId, uid(), title, String(20 - i), String(i * 3), i % 3 === 0],
    );
    rootIds.push(res.rows[0].id);
  }

  const childIds = [];
  for (let i = 0; i < childrenByRoot.length; i++) {
    for (const title of childrenByRoot[i]) {
      const res = await client.query(
        `INSERT INTO insights (user_id, uid, title, created_at, updated_at, is_public)
         VALUES ($1, $2, $3, NOW() - ($4 || ' days')::interval, NOW(), false)
         RETURNING id`,
        [userId, uid(), title, String(10 - (childIds.length % 8))],
      );
      const childId = res.rows[0].id;
      childIds.push(childId);
      await client.query(
        `INSERT INTO insight_links (parent_id, child_id) VALUES ($1, $2)`,
        [rootIds[i], childId],
      );
    }
  }

  // Cross-link a couple children for denser network feel
  if (childIds.length >= 6) {
    await client.query(
      `INSERT INTO insight_links (parent_id, child_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [rootIds[0], childIds[4]],
    ).catch(() => {});
    await client.query(
      `INSERT INTO insight_links (parent_id, child_id) VALUES ($1, $2)`,
      [rootIds[5], childIds[1]],
    );
  }

  const summaryIds = [];
  for (let i = 0; i < evidenceTitles.length; i++) {
    const [title, url] = evidenceTitles[i];
    const sourceId = sourceRows[i % sourceRows.length];
    const existing = await client.query(`SELECT id FROM summaries WHERE url = $1`, [url]);
    if (existing.rows[0]) {
      summaryIds.push(existing.rows[0].id);
      continue;
    }
    const res = await client.query(
      `INSERT INTO summaries (url, title, source_id, uid, original_title, created_at, updated_at)
       VALUES ($1::varchar, $2::varchar, $3, $4::text, $2::text, NOW(), NOW())
       RETURNING id`,
      [url, title, sourceId, uid()],
    );
    summaryIds.push(res.rows[0].id);
  }

  // Attach evidence across roots and children
  const allInsightIds = [...rootIds, ...childIds];
  for (let i = 0; i < summaryIds.length; i++) {
    const insightId = allInsightIds[i % allInsightIds.length];
    await client.query(
      `INSERT INTO evidence (summary_id, insight_id) VALUES ($1, $2)`,
      [summaryIds[i], insightId],
    );
    // Extra citations on roots for richer counts
    if (i < rootIds.length) {
      await client.query(
        `INSERT INTO evidence (summary_id, insight_id) VALUES ($1, $2)`,
        [summaryIds[(i + 3) % summaryIds.length], rootIds[i]],
      );
    }
  }

  // Comments + reactions on roots
  for (let i = 0; i < rootIds.length; i++) {
    await client.query(
      `INSERT INTO comments (comment, created_at, user_id, insight_id)
       VALUES ($1, NOW() - ($2 || ' hours')::interval, $3, $4)`,
      [comments[i % comments.length], String(i * 5 + 2), userId, rootIds[i]],
    );
    await client.query(
      `INSERT INTO reactions (reaction, user_id, created_at, insight_id)
       VALUES ($1, $2, CURRENT_DATE, $3)`,
      [["👍", "🔥", "💡", "👏"][i % 4], userId, rootIds[i]],
    );
  }

  await client.query("COMMIT");

  const counts = await client.query(
    `SELECT
       (SELECT count(*) FROM insights WHERE user_id = $1) AS insights,
       (SELECT count(*) FROM insights WHERE user_id = $1 AND uid LIKE 'seed%') AS seeded,
       (SELECT count(*) FROM insight_links il
          JOIN insights i ON i.id = il.parent_id WHERE i.user_id = $1) AS links`,
    [userId],
  );
  console.log(`Seeded sample insights for user_id=${userId}`);
  console.log(counts.rows[0]);
} catch (err) {
  await client.query("ROLLBACK");
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.end();
}
