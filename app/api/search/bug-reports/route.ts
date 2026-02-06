import sql from "@/lib/db";
import { sessionOptions } from "@/lib/session";
import { getIronSession, IronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

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
    if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").trim();
    const platform = searchParams.get("platform"); // e.g. "discord"
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);
    const LIMIT = Math.min(parseInt(searchParams.get("limit") ?? "10"), 200);

    const where = sql`
        WHERE 1=1
        ${search ? sql`AND (
            description ILIKE ${"%" + search + "%"} 
            OR EXISTS (
                SELECT 1 FROM jsonb_each_text(contact_methods) 
                WHERE value ILIKE ${"%" + search + "%"}
            )
        )` : sql``}
        ${platform ? sql`AND contact_methods ? ${platform}` : sql``}
    `;

    // 1. Get Total Count
    const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total FROM bug_reports ${where}
    `;

    // 2. Fetch Data (Newest First)
    const rows = await sql`
        SELECT 
            id, 
            contact_methods, 
            description, 
            created_at, 
            attachments
        FROM bug_reports
        ${where}
        ORDER BY created_at DESC
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