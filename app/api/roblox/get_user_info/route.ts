import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";

const CACHE_SECONDS = 60 * 60 * 24 * 8; // 8 Days

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
        return NextResponse.json(
            { error: "unauthorized lol" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "did you forget the user id?" },
            { status: 400 }
        );
    }

    const url = `https://users.roproxy.com/v1/users/${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
        next: {
            revalidate: CACHE_SECONDS,
        },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            {
                error: "roblox did not like that",
                robloxResponse: {
                    status: res.status,
                    body: data,
                },
            },
            { status: 500 }
        );
    }

    return NextResponse.json(data, {
        status: 200,
        headers: {
            "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, immutable`,
        },
    });
}
