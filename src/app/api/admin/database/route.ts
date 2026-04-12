import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type TableNameRow = { table_name: string };
type ColRow = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
};
type CountRow = { count: bigint };

function escIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function isForbiddenTable(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    !name ||
    lower.startsWith("pg_") ||
    lower.startsWith("information_schema")
  );
}

async function getPublicTables(): Promise<string[]> {
  const rows = await prisma.$queryRaw<TableNameRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return rows.map((r) => r.table_name).filter((n) => !isForbiddenTable(n));
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "bigint") {
      out[k] = v.toString();
    } else if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (Array.isArray(v)) {
      out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;
  const mode = searchParams.get("mode");

  const publicTables = await getPublicTables();

  if (!table) {
    const result = await Promise.all(
      publicTables.map(async (name) => {
        const [colResult, countResult] = await Promise.all([
          prisma.$queryRaw<CountRow[]>`
            SELECT COUNT(*) as count
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ${name}
          `,
          prisma.$queryRawUnsafe<CountRow[]>(
            `SELECT COUNT(*) as count FROM ${escIdent(name)}`
          ),
        ]);
        return {
          name,
          columnCount: Number(colResult[0].count),
          rowCount: Number(countResult[0].count),
        };
      })
    );
    return NextResponse.json(result);
  }

  if (!publicTables.includes(table) || isForbiddenTable(table)) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const columns = await prisma.$queryRaw<ColRow[]>`
    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table}
    ORDER BY ordinal_position
  `;

  if (mode === "schema") {
    return NextResponse.json({ columns });
  }

  const safeTable = escIdent(table);
  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM ${safeTable} LIMIT $1 OFFSET $2`,
      limit,
      offset,
    ),
    prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*) as count FROM ${safeTable}`
    ),
  ]);

  const total = Number(countResult[0].count);

  return NextResponse.json({
    columns,
    rows: rows.map(serializeRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
