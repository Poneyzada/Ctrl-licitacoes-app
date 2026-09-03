import { createClient, Client } from '@libsql/client';

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.DATABASE_LOCAL_URL || 'file:portal-local.db',
    });
  }
  return _client;
}

export class D1PreparedStatement {
  private sql: string;
  private params: any[];

  constructor(sql: string, params: any[] = []) {
    this.sql = sql;
    this.params = params;
  }

  bind(...args: any[]) {
    return new D1PreparedStatement(this.sql, args);
  }

  async all<T = any>(): Promise<{ results: T[]; success: boolean }> {
    const client = getClient();
    const rs = await client.execute({ sql: this.sql, args: this.params });
    const rows = rs.rows.map(row => {
      const obj: any = {};
      rs.columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj as T;
    });
    return { results: rows, success: true };
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    const { results } = await this.all<T>();
    if (results.length === 0) return null;
    if (colName) return (results[0] as any)[colName] ?? null;
    return results[0];
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const client = getClient();
    const rs = await client.execute({ sql: this.sql, args: this.params });
    return { success: true, meta: { changes: rs.rowsAffected } };
  }
}

export class D1DatabaseCompat {
  prepare(sql: string) {
    return new D1PreparedStatement(sql);
  }

  async batch(statements: D1PreparedStatement[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  async exec(sql: string) {
    const client = getClient();
    return await client.executeMultiple(sql);
  }
}

export const d1Database = new D1DatabaseCompat();

export function getD1() {
  return d1Database;
}
