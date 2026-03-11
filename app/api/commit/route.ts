import { NextRequest, NextResponse } from "next/server";
import { commitToHydra, HydraParty } from "@/lib/hydra";

// POST /api/commit
// Body: { party: "alice" | "bob" | "carol" }
export async function POST(req: NextRequest) {
  let party: string;

  try {
    ({ party } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!["alice", "bob", "carol"].includes(party)) {
    return NextResponse.json({ ok: false, error: `Unknown party: ${party}` }, { status: 400 });
  }

  try {
    const hash = await commitToHydra(party as HydraParty);
    return NextResponse.json({ ok: true, hash });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error(`[/api/commit] Error for ${party}:`, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
