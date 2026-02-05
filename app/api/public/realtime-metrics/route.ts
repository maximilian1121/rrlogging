import { NextRequest, NextResponse } from "next/server";
import globalEmitterPublic from "@/lib/globalEmitterPublic";

const DEV_PROXY_URL =
    "https://rr-logs.latific.click/api/public/realtime-metrics";

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "development") {
        const remote = await fetch(DEV_PROXY_URL, {
            method: "GET",
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

            const send = (event: string, data: any) => {
                if (!closed) {
                    try {
                        controller.enqueue(
                            encoder.encode(
                                `event: ${event}\n` +
                                    `data: ${JSON.stringify(data)}\n\n`,
                            ),
                        );
                    } catch {
                        closed = true;
                    }
                }
            };

            const sendRealtimeMetrics = (data: any) => {
                send("realtime-metrics", data);
            };

            const latest = globalEmitterPublic.latestRealtimeMetrics;
            if (latest) sendRealtimeMetrics(latest);

            globalEmitterPublic.on("realtime-metrics", sendRealtimeMetrics);

            return () => {
                closed = true;
                globalEmitterPublic.off(
                    "realtime-metrics",
                    sendRealtimeMetrics,
                );
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
