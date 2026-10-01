/**
 * Prepare sqlite + postgres for Playwright e2e.
 * Creates fieldnotes.db (auth/sessions) and ensures Bob exists in Postgres.
 * Expects Postgres schema to already exist (CI runs `yarn db:schema` first).
 *
 * Usage: node scripts/seed-e2e.mjs
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";
import Database from "better-sqlite3";

dotenv.config({ path: "./.env", quiet: true });

const email = "bob@datagotchi.net";
const password = "i0t4*375";
const dbPath = path.join(process.cwd(), "fieldnotes.db");

function seedSqlite() {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      token TEXT,
      avatar_uri TEXT,
      profile TEXT,
      expo_token TEXT,
      enable_push_notifications INTEGER,
      enable_email_notifications INTEGER,
      verified INTEGER,
      verification_key TEXT,
      password_reset_key TEXT
    );
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      expires TEXT NOT NULL
    );
    CREATE TABLE fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER
    );
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      datetime TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_id INTEGER NOT NULL,
      note_id INTEGER,
      value TEXT,
      user_id INTEGER
    );
  `);

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, username, email, password, enable_email_notifications, verified)
     VALUES (2, 'Bob Stark', ?, ?, 1, 1)`,
  ).run(email, hash);

  db.close();
  console.log(`Seeded ${dbPath} with ${email}`);
}

async function seedPostgres() {
  const client = new pg.Client({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME || "inspect",
  });

  await client.connect();

  const hash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO users (id, username, email, password)
     VALUES (2, 'Bob Stark', $1, $2)
     ON CONFLICT (id) DO UPDATE
       SET username = EXCLUDED.username,
           email = EXCLUDED.email,
           password = EXCLUDED.password`,
    [email, hash],
  );

  await client.query(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(2, (SELECT COALESCE(MAX(id), 2) FROM users)))`,
  );

  const summaries = await client.query(`SELECT id FROM summaries LIMIT 1`);
  if (summaries.rowCount === 0) {
    await client.query(
      `INSERT INTO summaries (uid, title, url, created_at, updated_at)
       VALUES ('e2elink1', 'E2E Sample Link', 'https://example.com/e2e', NOW(), NOW())`,
    );
  }

  await client.end();
  console.log(`Seeded Postgres user ${email} (id=2)`);
}

seedSqlite();
await seedPostgres();
