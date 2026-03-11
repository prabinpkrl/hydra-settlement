/**
 * lib/hydra.ts — server-side utilities for Hydra L1 operations
 *
 * NOTE: This module is Node.js-only (uses createRequire, readFileSync).
 *       Import it only from API routes or Server Actions, never from client components.
 */
import { createRequire } from "module";
import { readFileSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Paths — override with env vars for non-standard layouts
// ---------------------------------------------------------------------------

const CREDENTIALS_DIR =
  process.env.CREDENTIALS_DIR ??
  path.resolve(process.cwd(), "../kuber/kuber-hydra/devnet/credentials");

// hydra-example's node_modules are used as the module resolution root so we
// get the exact same kuber-client that the e2e script uses.
const HYDRA_EXAMPLE_DIR =
  process.env.HYDRA_EXAMPLE_DIR ??
  path.resolve(process.cwd(), "../kuber/kuber-hydra/hydra-example");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type HydraParty = "alice" | "bob" | "carol";

export const HYDRA_URLS: Record<HydraParty, string> = {
  alice: "http://localhost:8082",
  bob:   "http://localhost:8083",
  carol: "http://localhost:8084",
};

// ---------------------------------------------------------------------------
// Helper: load signing-key JSON for a party
// ---------------------------------------------------------------------------

function getSigningKey(party: HydraParty): object {
  const skPath = path.join(CREDENTIALS_DIR, `${party}-funds.sk`);
  return JSON.parse(readFileSync(skPath, "utf-8"));
}

// ---------------------------------------------------------------------------
// commitToHydra
//
// Commits a UTxO > 4 ADA from the party's L1 address into the Hydra head.
// Uses kuber-client's bundled libcardano-wallet (via createRequire) to avoid
// the auxData.value crash present in the top-level libcardano-wallet copy.
// ---------------------------------------------------------------------------

export async function commitToHydra(party: HydraParty): Promise<string> {
  // All heavy deps loaded dynamically — safe for Next.js WASM bundling
  const _r = createRequire(path.join(HYDRA_EXAMPLE_DIR, "package.json"));
  const { loadCrypto, Ed25519Key, Value } = _r("libcardano") as any;
  const { KuberHydraApiProvider }         = _r("kuber-client") as any;

  // THE FIX — load ShelleyWallet/Cip30ShelleyWallet from kuber-client's
  // bundled copy, not the top-level libcardano-wallet.  kuber-client's copy
  // has no nested libcardano of its own, so it parses the commit tx correctly.
  const _kr = createRequire(_r.resolve("kuber-client"));
  const { ShelleyWallet, Cip30ShelleyWallet } = _kr("libcardano-wallet") as any;

  await loadCrypto();

  const url   = HYDRA_URLS[party];
  const hydra = new KuberHydraApiProvider(url);

  // Load signing key from devnet credentials directory
  const skJson  = getSigningKey(party);
  const key     = await Ed25519Key.fromCardanoCliJson(skJson);
  const shelley = new ShelleyWallet(key);
  const wallet  = new Cip30ShelleyWallet(hydra, hydra, shelley, 0);
  const address = (await wallet.getChangeAddress()).toBech32();

  // Query L1 UTxOs and find one > 4 ADA
  const utxos    = await hydra.l1Api.queryUTxOByAddress(address);
  const selected = utxos.find((u: any) =>
    u.txOut.value.greaterThan(Value.fromString("4A"))
  );
  if (!selected) throw new Error(`No UTxO > 4 ADA found for ${party} (${address})`);

  const txIn  = selected.txIn;
  const txRef = `${txIn.txHash.toString("hex")}#${txIn.index}`;

  console.log(`[commitToHydra] ${party} — committing UTxO ${txRef}`);

  // Build commit tx (returns unsigned CBOR)
  const commitResult = await hydra.commit({ utxos: [txRef] });

  // Sign with kuber-client's bundled Cip30ShelleyWallet — no auxData crash
  const signResult = await wallet.signTx(commitResult.cborHex, true);

  // Submit signed tx to L1
  await hydra.l1Api.submitTx(signResult.updatedTxBytes.toString("hex"));

  console.log(`[commitToHydra] ${party} — submitted, waiting for L1 confirmation...`);

  // Wait up to 120 s for the UTxO to be consumed (confirms L1 inclusion)
  await hydra.l1Api.waitForUtxoConsumption(txIn, 120_000);

  console.log(`[commitToHydra] ${party} — committed. tx: ${commitResult.hash}`);
  return commitResult.hash as string;
}
