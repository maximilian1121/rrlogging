import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session: IronSession<{ user?: { password: string } }> = await getIronSession(req, res, sessionOptions);

  if (!session.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ authed: true });
}
