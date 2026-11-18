import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur");
  // prepare:false agar aman dengan connection pooler (Neon/Supabase pgbouncer)
  return postgres(url, { prepare: false, max: 5 });
}

const sql = globalThis.__pg ?? (globalThis.__pg = client());

export const db = drizzle(sql, { schema });
export * from "./schema";
