import { NextRequest, NextResponse } from "next/server";
import globalEmitterPublic from "@/lib/globalEmitterPublic";

export async function GET(req: NextRequest) {
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
                                `data: ${JSON.stringify(data)}\n\n`
                            )
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
                globalEmitterPublic.off("realtime-metrics", sendRealtimeMetrics);
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
