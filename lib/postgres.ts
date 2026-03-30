import { Pool } from "pg";

declare global {
  var __voccaPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is not set.");
  }
  return value;
}

export function getPool(): Pool {
  if (!globalThis.__voccaPool) {
    globalThis.__voccaPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return globalThis.__voccaPool;
}
