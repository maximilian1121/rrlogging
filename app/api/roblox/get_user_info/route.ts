import { NextRequest, NextResponse } from "next/server";

const CACHE_SECONDS = 60 * 60 * 24 * 8;

export async function GET(request: NextRequest) {
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
    data.profile_url = request.nextUrl.host + `/api/public/get-roblox-user/picture/${encodeURIComponent(userId)}`;

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
