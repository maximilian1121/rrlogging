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
        return NextResponse.json(
            { error: "unauthorized lol" },
            { status: 401 },
        );
    }

    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").toLowerCase();
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);
    const LIMIT = Math.min(parseInt(searchParams.get("limit") ?? "10"), 200);

    const filterLevels = searchParams.get("levels");
    const filterEnvironments = searchParams.get("environments");

    const levels = filterLevels
        ? filterLevels
              .split(",")
              .map((l) => parseInt(l.trim()))
              .filter((n) => !isNaN(n))
        : null;

    const environments = filterEnvironments
        ? filterEnvironments.split(",").map((l) => l.trim())
        : null;

    const where = sql`
        WHERE message_lower LIKE ${"%" + search + "%"}
        ${levels && levels.length > 0 ? sql`AND level IN ${sql(levels)}` : sql``}
        ${
            environments && environments.length > 0
                ? sql`AND environment IN ${sql(environments)}` 
                : sql``
        }
    `;

    const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total
        FROM (
            SELECT 1
            FROM logs
            ${where}
            GROUP BY message_lower, environment
        ) AS grouped_logs
    `;

    const rows = await sql`
        SELECT DISTINCT ON (message_lower, environment)
            *,
            COUNT(*) OVER (
                PARTITION BY message_lower, environment
            ) AS count
        FROM logs
        ${where}
        ORDER BY message_lower, environment, server_id, log_id DESC
        LIMIT ${LIMIT}
        OFFSET ${offset}
    `;

    return NextResponse.json({
        rows,
        total,
        limit: LIMIT,
        offset,
        pages: Math.ceil(total / LIMIT),
        page: Math.floor(offset / LIMIT) + 1,
    });
}
