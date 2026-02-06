import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

const CACHE_SECONDS = 60 * 60 * 24 * 8;

type UserProfile = {
    id: number;
    name: string;
    displayName: string;
    requestedUsername: string;
    hasVerifiedBadge: boolean;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    if (!userId) {
        const username = searchParams.get("username");
        const response = await fetch(
            "https://users.roblox.com/v1/usernames/users",
            {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: true,
                }),
            },
        );
        if (response.ok) {
            const json: { data: UserProfile[] } = await response.json();
            if (json.data.length > 0) {
                userId = json.data[0].id.toString();
            }
        } else {
            return NextResponse.json(
                { error: "Could not find user by username!" },
                { status: 404 },
            );
        }
    }

    if (!userId) {
        return NextResponse.json(
            { error: "Please provide all required fields username or userId" },
            { status: 400 },
        );
    }

    const url = `https://users.roproxy.com/v1/users/${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
        next: {
            revalidate: CACHE_SECONDS,
        },
    });

    const data = await res.json().catch(() => null);
    data.profile_url = `/api/public/get-roblox-user/picture/${encodeURIComponent(userId)}`;

    if (!res.ok) {
        return NextResponse.json(
            {
                error: "User not found!",
                robloxResponse: {
                    status: res.status,
                    body: data,
                },
            },
            { status: 404 },
        );
    }

    return NextResponse.json(data, {
        status: 200,
        headers: {
            "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, immutable`,
        },
    });
}
