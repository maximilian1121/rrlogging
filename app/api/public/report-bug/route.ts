import sql from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { isTrusted } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_BUG_DESCRIPTION_LENGTH = 100;

async function robloxUserExists(username: string) {
    if (!username.trim()) return false;
    try {
        const res = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: true,
            }),
            cache: "no-store",
        });

        if (!res.ok) return false;
        const json: { data: { id: number }[] } = await res.json();
        return json.data.length > 0;
    } catch (err) {
        console.error("Roblox API check failed:", err);
        return false;
    }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed, retryAfter } = rateLimit(ip, 5, 60_000);

    if (!allowed) {
        return NextResponse.json(
            { error: `Rate limit exceeded. Try again in ${retryAfter}s` },
            {
                status: 429,
                headers: { "Cache-Control": "no-store, max-age=0" },
            },
        );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { contact_info, description, attachments = [] } = body;

    if (
        !contact_info ||
        typeof contact_info !== "object" ||
        !Object.values(contact_info).some(
            (v: any) => typeof v === "string" && v.trim(),
        )
    ) {
        return NextResponse.json(
            { error: "At least one contact method must be provided" },
            { status: 400 },
        );
    }

    if (
        !description ||
        description.trim().length < MIN_BUG_DESCRIPTION_LENGTH
    ) {
        return NextResponse.json(
            {
                error: `Bug description must be at least ${MIN_BUG_DESCRIPTION_LENGTH} characters`,
            },
            { status: 400 },
        );
    }

    if (contact_info.roblox) {
        const exists = await robloxUserExists(contact_info.roblox);
        if (!exists) {
            return NextResponse.json(
                { error: "Provided Roblox username does not exist" },
                { status: 400 },
            );
        }
    }

    if (!Array.isArray(attachments)) {
        return NextResponse.json(
            { error: "Attachments must be an array" },
            { status: 400 },
        );
    }

    const untrustedAttachments = attachments.filter(
        (a) => typeof a !== "string" || !isTrusted(a),
    );
    if (untrustedAttachments.length > 0) {
        console.warn("Untrusted attachments submitted:", untrustedAttachments);
    }

    try {
        console.log("Attempting DB Insert...");
        const contactInfoJson = contact_info;
        const attachmentsArray = attachments;

        await sql`
      INSERT INTO bug_reports (contact_methods, description, attachments)
      VALUES (
        ${contactInfoJson}, 
        ${description.trim()}, 
        ${attachmentsArray} 
      )
    `;

        return NextResponse.json(
            {
                success: true,
                message: "Bug report submitted successfully",
            },
            {
                headers: { "Cache-Control": "no-store" },
            },
        );
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json(
            { error: "Failed to save bug report. Please try again later." },
            { status: 500 },
        );
    }
}
