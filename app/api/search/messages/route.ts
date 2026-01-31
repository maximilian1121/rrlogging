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
    let search = searchParams.get("search");
    const filterLevels = searchParams.get("levels");
    const filterEnvironments = searchParams.get("environments");

    if (!search) {
        search = "%";
    }

    const levels = filterLevels
        ? filterLevels
              .split(",")
              .map((l) => parseInt(l.trim()))
              .filter((n) => !isNaN(n))
        : null;

    const environments = filterEnvironments
        ? filterEnvironments.split(",").map((l) => l.trim())
        : null;

    const data = await sql`
    SELECT DISTINCT ON (message_lower, environment)
        *,
        COUNT(*) OVER (
            PARTITION BY message_lower, environment
        ) as count
    FROM logs
    WHERE message_lower LIKE ${"%" + search.toLowerCase() + "%"}
    ${levels && levels.length > 0 ? sql`AND level IN ${sql(levels)}` : sql``}
    ${environments && environments.length > 0 ? sql`AND environment IN ${sql(environments)}` : sql``}
    ORDER BY message_lower, environment, server_id, log_id DESC;
`;

    return NextResponse.json(data);
}
