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

    let accumulatedData = {
        active_players: 0,
        visits: 0,
        likes: 0,
        dislikes: 0,
        favorites: 0,

        rate_limits: {
            stats_fetch: {
                max: 5,
                remaining: 5,
                reset_in: 0,
            },
            votes_fetch: {
                max: 5,
                remaining: 5,
                reset_in: 0,
            },
        },
    };

    try {
        const fetchOne = await fetch(
            "https://games.roblox.com/v1/games?universeIds=8165448763&languageCode=en_us",
        );

        if (fetchOne.ok) {
            const data = await fetchOne.json();
            const fetchOneJson = data.data?.[0];
            if (fetchOneJson) {
                accumulatedData.visits = fetchOneJson.visits;
                accumulatedData.active_players = fetchOneJson.playing;
                accumulatedData.favorites = fetchOneJson.favoritedCount;
            }

            const remaining = fetchOne.headers.get("x-ratelimit-remaining");
            const reset = fetchOne.headers.get("x-ratelimit-reset");
            const limit = fetchOne.headers.get("x-ratelimit-limit");

            if (remaining)
                accumulatedData.rate_limits.stats_fetch.remaining =
                    parseInt(remaining);
            if (reset)
                accumulatedData.rate_limits.stats_fetch.reset_in =
                    parseInt(reset);
            if (limit)
                accumulatedData.rate_limits.stats_fetch.max = parseInt(
                    limit.split(",")[0],
                );
        }

        const fetchTwo = await fetch(
            "https://games.roblox.com/v1/games/votes?universeIds=8165448763",
        );

        if (fetchTwo.ok) {
            const data = await fetchTwo.json();
            const fetchTwoJson = data.data?.[0];
            if (fetchTwoJson) {
                accumulatedData.likes = fetchTwoJson.upVotes;
                accumulatedData.dislikes = fetchTwoJson.downVotes;
            }

            const remaining = fetchTwo.headers.get("x-ratelimit-remaining");
            const reset = fetchTwo.headers.get("x-ratelimit-reset");
            const limit = fetchTwo.headers.get("x-ratelimit-limit");

            if (remaining)
                accumulatedData.rate_limits.votes_fetch.remaining =
                    parseInt(remaining);
            if (reset)
                accumulatedData.rate_limits.votes_fetch.reset_in =
                    parseInt(reset);
            if (limit)
                accumulatedData.rate_limits.votes_fetch.max = parseInt(
                    limit.split(",")[0],
                );
        }

        globalEmitterPublic.emit("realtime-metrics", accumulatedData);

        const rows = await sql`
            INSERT INTO metrics (
                active,
                visits,
                likes,
                dislikes,
                favorites
            )
            VALUES (
                ${accumulatedData.active_players},
                ${accumulatedData.visits},
                ${accumulatedData.likes},
                ${accumulatedData.dislikes},
                ${accumulatedData.favorites}
            )
            RETURNING *;
        `;

        return NextResponse.json(accumulatedData, { status: 200 });
    } catch (e) {
        console.error("Fetch error:", e);
        return NextResponse.json(
            { error: "Error fetching data from Roblox API" },
            { status: 503 },
        );
    }
}
