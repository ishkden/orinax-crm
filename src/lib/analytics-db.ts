import pg from "pg";

let pool: pg.Pool | null = null;

export function getAnalyticsPool(): pg.Pool {
  if (!pool) {
    const url = process.env.ANALYTICS_DATABASE_URL;
    if (!url) throw new Error("ANALYTICS_DATABASE_URL is not set");
    pool = new pg.Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

export async function queryAnalytics<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const p = getAnalyticsPool();
  const result = await p.query(sql, params);
  return result.rows as T[];
}
