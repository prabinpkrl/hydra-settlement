import { NextRequest, NextResponse } from "next/server";

const HYDRA_PORTS: Record<string, number> = {
  alice: 8082,
  bob: 8083,
  carol: 8084,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const party = searchParams.get("party") || "alice";

  const port = HYDRA_PORTS[party];
  if (!port) {
    return NextResponse.json(
      { error: `Invalid party: ${party}` },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`http://localhost:${port}/hydra/query/head`);
    
    if (!response.ok) {
      throw new Error(`Hydra node responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[/api/hydra/query/head] Error for ${party}:`, error.message);
    return NextResponse.json(
      { error: error.message || "Failed to query Hydra node" },
      { status: 502 }
    );
  }
}
