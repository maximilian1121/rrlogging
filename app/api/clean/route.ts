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

    const phrases = [
        "Failed to load sound rbxassetid://",
        "MeshContentProvider failed to process https://asset",
        "SolidModelContentProvider failed to process https://assetdelivery.roblox.com",
        "http://www.roblox.com/asset/",
        "https://assetdelivery.roblox.com",
        "vip",
        "table:",
        "UITextSizeConstraint's MaxFontSize as it is smaller than MinFontSize.",
        "Multiple StyleLinks under Children may result in undefined behavior",
        "Not enough TIX",
        "All ability slots are full!"
    ];

    for (const phrase of phrases) {
        await sql`DELETE FROM logs WHERE message_lower LIKE ${`%${phrase.toLowerCase()}%`}`;
    }

    await sql`
    DELETE FROM logs 
    WHERE message_lower ~ 'players\\..*\\.settings:waitforchild\\(".*"\\)'
`;

    await sql`DELETE FROM logs WHERE message = 'RAHHREAHREHAREHRHEAHRESAHFSHDFYUHSDUG'`;

    return NextResponse.json({ status: "ok", deleted: phrases.length + 1 });
}
