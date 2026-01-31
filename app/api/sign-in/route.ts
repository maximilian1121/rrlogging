import { NextResponse } from "next/server";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";

const CORRECT_PASSWORD = process.env.NEXT_PRIVATE_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (password !== CORRECT_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ message: "Signed in successfully" });

  const session: IronSession<{ user?: { password: string } }> = await getIronSession(req, res, sessionOptions);
  session.user = { password };
  await session.save();

  return res;
}
