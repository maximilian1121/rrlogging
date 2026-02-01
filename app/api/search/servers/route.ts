import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { Row, RowList } from "postgres";

async function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey === process.env.NEXT_PRIVATE_API_KEY) return true;

  const res = NextResponse.next();
  const session: IronSession<{ user?: { password: string } }> =
    await getIronSession(req, res, sessionOptions);

  return !!session.user;
}

export async function GET(request: NextRequest) {
  const authorized = await checkAuth(request);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized lol" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || null;
  const contains_like_message = searchParams.get("contains_like_message") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 25), 200);
  const offset = Number(searchParams.get("offset")) || 0;

  let serversQuery = sql`
    SELECT DISTINCT server_id
    FROM logs
    WHERE 1=1
  `;

  if (search)
    serversQuery = sql`${serversQuery} AND LOWER(server_id) LIKE ${"%" + search.toLowerCase() + "%"}`;
  if (contains_like_message)
    serversQuery = sql`${serversQuery} AND LOWER(message) LIKE ${"%" + contains_like_message.toLowerCase() + "%"}`;

  const allServersResult: RowList<Row[]> = await serversQuery;
  const allServers = allServersResult.map(r => ({ server_id: r.server_id }));
  const totalCount = allServers.length;

  const pagedServers = allServers.slice(offset, offset + limit).map(s => s.server_id);
  if (pagedServers.length === 0) {
    return NextResponse.json({ data: [], totalCount });
  }

  const logsQuery = sql<Log[]>`
    SELECT *
    FROM logs
    WHERE server_id = ANY(${pagedServers})
    ORDER BY server_id, log_id DESC
  `;

  const logs = await logsQuery;

  return NextResponse.json({ data: logs, totalCount });
}
