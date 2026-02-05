import { NextRequest, NextResponse, after } from "next/server";
import sharp from "sharp";

const cache = new Map<string, { buffer: Buffer; contentType: string; expires: number }>();
const hours = 4;
const CACHE_TTL = hours * 60 * 60 * 1000;

interface Params {
    userid: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
    const { userid: userId } = await params;
    const now = Date.now();
    const cached = cache.get(userId);

    if (cached && cached.expires > now) {
        return new NextResponse(cached.buffer, {
            status: 200,
            headers: {
                "Content-Type": cached.contentType,
                "Cache-Control": "public, max-age=86400, immutable",
            },
        });
    }

    const response = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );
    
    if (!response.ok) return NextResponse.json({ ok: false }, { status: 500 });

    const json = await response.json();
    const imageUrl = json.data?.[0]?.imageUrl;
    
    if (!imageUrl) return NextResponse.json({ ok: false }, { status: 404 });

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return NextResponse.json({ ok: false }, { status: 500 });

    const pngBuffer = Buffer.from(await imageResponse.arrayBuffer());

    after(async () => {
        try {
            const avifBuffer = await sharp(pngBuffer).avif({ quality: 50 }).toBuffer();
            cache.set(userId, { 
                buffer: avifBuffer, 
                contentType: "image/avif", 
                expires: Date.now() + CACHE_TTL 
            });
        } catch (err) {
            console.error(err);
        }
    });

    return new NextResponse(pngBuffer, {
        status: 200,
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store",
        },
    });
}