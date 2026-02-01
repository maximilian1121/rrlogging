import globalEmitter from "@/lib/globalEmitter";
import { sessionOptions } from "@/lib/session";
import { getIronSession, IronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

const DEV_PROXY_URL = "https://rr-logs.latific.click/api/events";

export async function GET(req: NextRequest) {
    const res = NextResponse.next();

    const apiKey = req.headers.get("x-api-key");
    const hasApiKey = apiKey === process.env.NEXT_PRIVATE_API_KEY;

    const session: IronSession<{ user?: { password: string } }> =
        await getIronSession(req, res, sessionOptions);
    const hasSession = !!session.user;

    if (!hasApiKey && !hasSession) {
        return NextResponse.json(
            { error: "unauthorized - no api key or session" },
            { status: 401 },
        );
    }

    if (process.env.NODE_ENV === "development") {
        const headers = new Headers();

        const cookie = req.headers.get("cookie");
        if (cookie) headers.set("cookie", cookie);

        if (hasApiKey) headers.set("x-api-key", apiKey!);

        const remote = await fetch(DEV_PROXY_URL, {
            method: "GET",
            headers: {
                "x-api-key": process.env.NEXT_PRIVATE_API_KEY!,
            },
        });

        if (!remote.body) {
            return NextResponse.json(
                { error: "remote SSE had no body" },
                { status: 502 },
            );
        }

        return new Response(remote.body, {
            status: remote.status,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(":keepalive\n\n"));
            let closed = false;

            const send = (data: any) => {
                if (!closed) {
                    try {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                        );
                    } catch {
                        closed = true;
                    }
                }
            };

            const keepalive = () => {
                if (!closed) {
                    try {
                        controller.enqueue(encoder.encode(":keepalive\n\n"));
                    } catch {
                        closed = true;
                    }
                }
            };

            globalEmitter.on("global-event", send);
            globalEmitter.on("log-added", send);
            globalEmitter.on("keepalive", keepalive);

            return () => {
                closed = true;
                globalEmitter.off("global-event", send);
                globalEmitter.off("log-added", send);
                globalEmitter.off("keepalive", keepalive);
            };
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
