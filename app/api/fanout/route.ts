import { NextResponse } from "next/server";
import { createRequire } from "module";
import path from "path";

const HYDRA_EXAMPLE_DIR =
  process.env.HYDRA_EXAMPLE_DIR ??
  path.resolve(process.cwd(), "../kuber/kuber-hydra/hydra-example");

export async function POST() {
  try {
    const _r = createRequire(path.join(HYDRA_EXAMPLE_DIR, "package.json"));
    const { loadCrypto }            = _r("libcardano") as any;
    const { KuberHydraApiProvider } = _r("kuber-client") as any;

    await loadCrypto();

    const hydraAlice = new KuberHydraApiProvider("http://localhost:8082");

    console.log("[/api/fanout] Sending fanout request via Alice's relay...");
    await hydraAlice.fanout(true);
    console.log("[/api/fanout] Fanout accepted.");

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[/api/fanout] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
