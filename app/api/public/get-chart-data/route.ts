import sql from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const dateRange = params.get("dateRange");

    if (!dateRange) return Response.json({ error: "dateRange required (start_end)" }, { status: 400 });

    const [startRaw, endRaw] = dateRange.split("_");
    if (!startRaw || !endRaw) return Response.json({ error: "Invalid dateRange format" }, { status: 400 });

    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return Response.json({ error: "Invalid date values" }, { status: 400 });

    const metrics = await sql`
        SELECT *
        FROM metrics
        WHERE recorded_at >= ${start} AND recorded_at <= ${end}
        ORDER BY recorded_at ASC
    `;

    return Response.json(metrics);
}