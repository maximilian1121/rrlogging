import sql from "@/lib/db";
import { NextRequest } from "next/server";

function getBucket(rangeMs: number) {
    const hours = rangeMs / (1000 * 60 * 60);

    if (hours <= 6) return "minute";
    if (hours <= 24) return "5 minutes";
    if (hours <= 24 * 7) return "hour";
    return "day";
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const dateRange = params.get("dateRange");

    if (!dateRange)
        return Response.json(
            { error: "dateRange required (start_end)" },
            { status: 400 },
        );

    const [startRaw, endRaw] = dateRange.split("_");

    const start = new Date(startRaw);
    const end = new Date(endRaw);

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
        return Response.json({ error: "Invalid date values" }, { status: 400 });

    const rangeMs = end.getTime() - start.getTime();
    const bucket = getBucket(rangeMs);

    const metrics = await sql`
  SELECT
    date_trunc(${bucket}, recorded_at) AS bucket,

    SUM(active) AS active,
    SUM(visits) AS visits,
    SUM(likes) AS likes,
    SUM(dislikes) AS dislikes,
    SUM(favorites) AS favorites

  FROM metrics
  WHERE recorded_at BETWEEN ${start} AND ${end}
  GROUP BY bucket
  ORDER BY bucket ASC
`;

    return Response.json({
        bucket,
        points: metrics.length,
        data: metrics,
    });
}
