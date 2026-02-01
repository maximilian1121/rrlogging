import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";

async function checkAuth(req: NextRequest) {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey === process.env.NEXT_PRIVATE_API_KEY) return true;

    const res = NextResponse.next();
    const session: IronSession<{ user?: { password: string } }> =
        await getIronSession(req, res, sessionOptions);

    if (session.user) return true;

    return false;
}

export async function GET(request: NextRequest) {
    const authorized = await checkAuth(request);
    if (!authorized) {
        return NextResponse.json({ error: "unauthorized lol" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const server_id = searchParams.get("server_id");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    let data;

    if (search) {
        data = await sql`
            SELECT *
            FROM public.logs
            WHERE message_lower LIKE ${"%" + search.toLowerCase() + "%"}
            ORDER BY logged_at DESC
            LIMIT ${limit} OFFSET ${offset};
        `;
    } else if (server_id) {
        data = await sql`
            SELECT *
            FROM public.logs
            WHERE server_id = ${server_id}
            ORDER BY logged_at DESC
            LIMIT ${limit} OFFSET ${offset};
        `;
    } else {
        data = await sql`
            SELECT *
            FROM public.logs
            ORDER BY logged_at DESC
            LIMIT ${limit} OFFSET ${offset};
        `;
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const authorized = await checkAuth(request);
    if (!authorized) {
        return NextResponse.json(
            { error: "unauthorized lol" },
            { status: 401 },
        );
    }

    let logs;
    try {
        logs = await request.json();
    } catch {
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    if (!Array.isArray(logs)) {
        return NextResponse.json(
            { error: "body must be an array" },
            { status: 400 },
        );
    }

    if (logs.length === 0) {
        return NextResponse.json({ inserted: 0 });
    }

    const rows = logs.map((log) => ({
        server_id:
            log.server_id && log.server_id.trim() !== ""
                ? log.server_id
                : "studio",
        message: log.message,
        message_lower: log.message_lower,
        level: log.level,
        environment: log.environment,
        userid: log.userid ?? null,
    }));

    try {
        await sql`
      INSERT INTO logs (
        server_id,
        message,
        message_lower,
        level,
        environment,
        userid
      )
      SELECT
        server_id,
        message,
        message_lower,
        level,
        environment,
        userid
      FROM jsonb_to_recordset(${sql.json(rows)}) AS t(
        server_id text,
        message text,
        message_lower text,
        level int,
        environment text,
        userid bigint
      )
    `;

        global.globalEmitter.emit("log-added", { event: "log-added", rows });

        return NextResponse.json({ inserted: rows.length });
    } catch (err) {
        console.error("DB insert failed:", err);
        return NextResponse.json({ error: "db exploded" }, { status: 500 });
    }
}
