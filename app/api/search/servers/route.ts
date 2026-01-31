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
    const search = searchParams.get("search");

    let data;

    if (search) {
        data = await sql`
        SELECT DISTINCT ON (server_id) *
        FROM logs
        WHERE server_id LIKE ${"%" + search.toLowerCase() + "%"}
        ORDER BY server_id, log_id DESC;
    `;
    } else {
        data = await sql`
        SELECT DISTINCT ON (server_id) *
        FROM logs
        ORDER BY server_id, log_id DESC;
    `;
    }

    let response: String[] = [];

    data.forEach((server) => {
        response.push(server.server_id)
    })

    return NextResponse.json(response);
}
