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

    console.log("[/api/hydra/init] Sending initialize request via Alice...");
    await hydraAlice.initialize();
    console.log("[/api/hydra/init] Initialize accepted.");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[/api/hydra/init] Error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
