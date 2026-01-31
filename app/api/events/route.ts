import globalEmitter from "@/lib/globalEmitter";
import { sessionOptions } from "@/lib/session";
import { getIronSession, IronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const res = NextResponse.next();
  const session: IronSession<{ user?: { password: string } }> = await getIronSession(req, res, sessionOptions);

    if (!session.user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(":keepalive\n\n"));

            let isClosed = false;

            const listener = (data: any) => {
                if (!isClosed) {
                    try {
                        const queue = encoder.encode(
                            `data: ${JSON.stringify(data)}\n\n`,
                        );
                        controller.enqueue(queue);
                    } catch (error) {
                        isClosed = true;
                    }
                }
            };

            const keepaliveListener = () => {
                if (!isClosed) {
                    try {
                        controller.enqueue(encoder.encode(":keepalive\n\n"));
                    } catch (error) {
                        isClosed = true;
                    }
                }
            };

            globalEmitter.on("global-event", listener);
            globalEmitter.on("log-added", listener);
            globalEmitter.on("keepalive", keepaliveListener);

            return () => {
                isClosed = true;
                globalEmitter.off("global-event", listener);
                globalEmitter.off("keepalive", keepaliveListener);
            };
        },
    });

    return new Response(customReadable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
