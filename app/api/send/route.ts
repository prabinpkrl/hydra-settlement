import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import { readFileSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Paths — override with env vars if needed
// ---------------------------------------------------------------------------

const CREDENTIALS_DIR =
  process.env.CREDENTIALS_DIR ??
  path.resolve(process.cwd(), "../kuber/kuber-hydra/devnet/credentials");

// hydra-example's node_modules are used as the module resolution root so we
// get the exact same package copies that the e2e script uses (avoids auxData crash).
const HYDRA_EXAMPLE_DIR =
  process.env.HYDRA_EXAMPLE_DIR ??
  path.resolve(process.cwd(), "../kuber/kuber-hydra/hydra-example");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HYDRA_URLS: Record<string, string> = {
  alice: "http://localhost:8082",
  bob:   "http://localhost:8083",
  carol: "http://localhost:8084",
};

const PARTY_ADDRESSES: Record<string, string> = {
  alice: "addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4",
  bob:   "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k",
  carol: "addr_test1vrf9ksqwtvkyzgld4uh377prmzlsgyvmsvp9xe56tr3kk8g5g2z0x",
};

// ---------------------------------------------------------------------------
// POST /api/send
// Body: { from: "alice"|"bob"|"carol", toAddress: string, lovelace: number }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let from: string, toAddress: string, lovelace: number;

  try {
    ({ from, toAddress, lovelace } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const hydraUrl    = HYDRA_URLS[from];
  const fromAddress = PARTY_ADDRESSES[from];

  if (!hydraUrl || !fromAddress) {
    return NextResponse.json({ ok: false, error: `Unknown party: ${from}` }, { status: 400 });
  }

  const skPath = path.join(CREDENTIALS_DIR, `${from}-funds.sk`);

  try {
    // -----------------------------------------------------------------------
    // All Node.js / WASM libraries loaded dynamically from hydra-example's
    // node_modules to guarantee the same package versions as the e2e script.
    // -----------------------------------------------------------------------
    const _r = createRequire(path.join(HYDRA_EXAMPLE_DIR, "package.json"));
    const { loadCrypto, Ed25519Key } = _r("libcardano") as any;
    const { KuberHydraApiProvider }  = _r("kuber-client") as any;

    // Load wallet via kuber-client's bundled libcardano-wallet — this copy has
    // no nested libcardano of its own, so it uses the outer copy and avoids the
    // auxData.value crash that hits the top-level libcardano-wallet package.
    const _kr = createRequire(_r.resolve("kuber-client"));
    const { ShelleyWallet, Cip30ShelleyWallet } = _kr("libcardano-wallet") as any;

    // Load WASM once per request (idempotent)
    await loadCrypto();

    // Build wallet from signing key file
    const skJson  = JSON.parse(readFileSync(skPath, "utf-8"));
    const key     = await Ed25519Key.fromCardanoCliJson(skJson);
    const shelley = new ShelleyWallet(key);
    const hydra   = new KuberHydraApiProvider(hydraUrl);
    const wallet  = new Cip30ShelleyWallet(hydra, hydra, shelley, 0);

    // Build L2 transaction
    console.log(`[/api/send] Building L2 tx: ${from} → ${toAddress}  ${lovelace} lovelace`);
    const builtTx = await hydra.buildWithWallet(wallet, {
      selections:    [fromAddress],
      outputs:       [{ address: toAddress, value: String(lovelace) }],
      changeAddress: fromAddress,
    });

    // Sign (witness-only = true, CRITICAL for Hydra L2 txs)
    const signResult = await wallet.signTx(builtTx.cborHex, true);

    // Submit to L2
    await hydra.submitTx(signResult.updatedTxBytes.toString("hex"));

    console.log(`[/api/send] Submitted: ${builtTx.hash}`);
    return NextResponse.json({ ok: true, hash: builtTx.hash });

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[/api/send] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
