import postgres from "postgres";

declare global {
  // Reuse one connection pool across hot reloads in dev.
  var __sql: postgres.Sql | undefined;
  var __schemaReady: Promise<void> | undefined;
}

const sql =
  globalThis.__sql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // required for Neon / pgbouncer pooled connections
    max: 5,
    onnotice: () => {},
  });
globalThis.__sql = sql;

/** Tables are created automatically the first time the app talks to the database. */
function ensureSchema() {
  globalThis.__schemaReady ??= sql`
    create table if not exists users (
      email text primary key,
      name text not null default '',
      created_at timestamptz not null default now()
    );
    create table if not exists bids (
      meal_id text not null,
      email text not null,
      amounts integer[] not null,          -- cents
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (meal_id, email)
    );
    create table if not exists cleared_meals (
      meal_id text primary key,
      cancelled boolean not null default false,
      cleared_at timestamptz not null default now()
    );
    create table if not exists results (
      meal_id text not null,
      meal_date date not null,
      email text not null,
      bid_amounts integer[] not null,      -- after any budget trimming
      trimmed boolean not null default false,
      guests integer not null,
      payment integer not null,            -- cents
      unit_prices integer[] not null,
      primary key (meal_id, email)
    );
    create table if not exists cancelled_meals (
      meal_id text primary key
    );
    create table if not exists residents (
      email text primary key
    );
  `
    .simple()
    .then(() => undefined)
    .catch((e) => {
      globalThis.__schemaReady = undefined;
      throw e;
    });
  return globalThis.__schemaReady;
}

export async function db() {
  await ensureSchema();
  return sql;
}
