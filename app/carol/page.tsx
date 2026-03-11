"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEscrowStore } from "@/lib/escrow-store";

const HYDRA_URL    = "http://localhost:8084";
const CAROL_ADDRESS = "addr_test1vrf9ksqwtvkyzgld4uh377prmzlsgyvmsvp9xe56tr3kk8g5g2z0x";
const ALICE_ADDRESS = "addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4";
const BOB_ADDRESS   = "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k";

const DISPUTE_AMOUNT_LOVELACE = 5_000_000;
const DISPUTE_AMOUNT_ADA      = "5";

type UtxoMap = Record<string, { address: string; value: { lovelace: number } }>;

function statusColor(tag: string) {
  if (tag === "Open")            return "bg-green-500";
  if (tag === "Initial")         return "bg-yellow-400";
  if (tag === "Idle")            return "bg-gray-400";
  if (tag === "Closed" || tag === "Final") return "bg-red-400";
  return "bg-gray-300";
}

function shortRef(ref: string) {
  const [hash, idx] = ref.split("#");
  return `${hash.slice(0, 8)}...${hash.slice(-4)}#${idx}`;
}

export default function CarolPage() {
  // ── Head + UTxO state ────────────────────────────────────────────────────
  const [headTag, setHeadTag] = useState("...");
  const [utxos,   setUtxos]   = useState<UtxoMap>({});
  const [balance, setBalance] = useState(0);

  // ── Mediator escrow state ────────────────────────────────────────────────
  const [resolution, setResolution] = useState<"" | "paid" | "refunded">("");
  const [txHash,     setTxHash]     = useState("");
  
  // ── Escrow store state ───────────────────────────────────────────────────
  const { status: escrowStatus, amount: escrowAmount, disputeReason, recipientAddress, setEscrow } = useEscrowStore();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Head + UTxO polling ──────────────────────────────────────────────────
  useEffect(() => {
    async function poll() {
      try {
        const [headRes, utxoRes] = await Promise.all([
          fetch(`${HYDRA_URL}/hydra/query/head`),
          fetch(`${HYDRA_URL}/hydra/query/utxo`),
        ]);

        if (headRes.ok) {
          const h = await headRes.json();
          setHeadTag(h.tag ?? "Unknown");
        } else {
          setHeadTag("Offline");
        }

        if (utxoRes.ok) {
          const all: UtxoMap = await utxoRes.json();
          const mine: UtxoMap = {};
          let total = 0;
          for (const [ref, u] of Object.entries(all)) {
            if (u.address === CAROL_ADDRESS) {
              mine[ref] = u;
              total += u.value?.lovelace ?? 0;
            }
          }
          setUtxos(mine);
          setBalance(total);
        }
      } catch {
        setHeadTag("Offline");
      }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function sendADA(toAddress: string, lovelace: number): Promise<string> {
    const res = await fetch("/api/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ from: "carol", toAddress, lovelace }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Send failed");
    return data.hash as string;
  }

  // ── Pay Bob ──────────────────────────────────────────────────────────────
  async function handlePayBob() {
    if (loading || resolution !== "" || headTag !== "Open") return;
    setLoading(true);
    try {
      const lovelace = Number(escrowAmount) || DISPUTE_AMOUNT_LOVELACE;
      const recipient = recipientAddress || BOB_ADDRESS;
      const hash = await sendADA(recipient, lovelace);
      setTxHash(hash);
      setResolution("paid");
      setEscrow({ status: "COMPLETED", txHash: hash });
      showToast("Payment sent to recipient!", true);
    } catch (err: any) {
      showToast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Refund Alice ─────────────────────────────────────────────────────────
  async function handleRefundAlice() {
    if (loading || resolution !== "" || headTag !== "Open") return;
    setLoading(true);
    try {
      const lovelace = Number(escrowAmount) || DISPUTE_AMOUNT_LOVELACE;
      const hash = await sendADA(ALICE_ADDRESS, lovelace);
      setTxHash(hash);
      setResolution("refunded");
      setEscrow({ status: "COMPLETED", txHash: hash });
      showToast("Refund sent to Alice!", true);
    } catch (err: any) {
      showToast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  const isOpen           = headTag === "Open";
  const buttonsDisabled  = loading || !isOpen || resolution !== "";
  const utxoEntries = Object.entries(utxos);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto py-12 px-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium ${
            toast.ok
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</Link>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Carol</h1>
              <p className="text-sm text-gray-500">Mediator</p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all">
                addr_test1vrf9ksqwtvkyzgld4uh377prmzlsgyvmsvp9xe56tr3kk8g5g2z0x
              </p>
            </div>
            <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor(headTag)} ${isOpen ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium text-gray-700">{headTag}</span>
            </span>
          </div>
        </div>

        {/* L2 Balance */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">L2 Balance</h2>
          {!isOpen ? (
            <p className="text-sm text-gray-400">Head must be Open to view L2 funds.</p>
          ) : utxoEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No funds at this address.</p>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {(balance / 1_000_000).toFixed(2)}{" "}
                <span className="text-base font-normal text-gray-500">ADA</span>
              </div>
              <div className="flex flex-col gap-2">
                {utxoEntries.map(([ref, u]) => (
                  <div key={ref} className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="font-mono text-gray-500 text-xs">{shortRef(ref)}</span>
                    <span className="text-gray-800 font-medium">
                      {(u.value.lovelace / 1_000_000).toFixed(2)} ADA
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Dispute Active Section */}
        {escrowStatus === "DISPUTED" && (
          <section className="bg-white border border-orange-200 rounded-lg p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-orange-900">Dispute Active</h2>
              <p className="text-xs text-orange-600">Review the dispute and choose a resolution</p>
            </div>
            <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200">
              Pending
            </span>
          </div>

          {/* Dispute details */}
          <div className="bg-orange-50 rounded-md p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dispute Amount</span>
                <span className="font-semibold text-gray-900">{escrowAmount ? `${(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA` : `${DISPUTE_AMOUNT_ADA} ADA`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sender (Alice)</span>
              <span className="font-mono text-xs text-gray-500">
                {ALICE_ADDRESS.slice(0, 12)}...{ALICE_ADDRESS.slice(-6)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Receiver (Bob)</span>
              <span className="font-mono text-xs text-gray-500">
                {BOB_ADDRESS.slice(0, 12)}...{BOB_ADDRESS.slice(-6)}
              </span>
            </div>
            <div className="pt-1 border-t border-orange-200">
              <p className="text-xs text-orange-700 font-semibold mb-1">Dispute Reason (Mock)</p>
              <p className="text-xs text-orange-600">
                Alice claims the delivery did not match the agreed specifications.
              </p>
            </div>
          </div>

          {/* Resolution buttons */}
          {resolution === "" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePayBob}
                disabled={buttonsDisabled}
                className="w-full bg-green-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : (
                  "Pay Bob"
                )}
              </button>

              <button
                onClick={handleRefundAlice}
                disabled={buttonsDisabled}
                className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : (
                  "Refund Alice"
                )}
              </button>

              {!isOpen && (
                <p className="text-xs text-gray-400 text-center">
                  Head must be Open to resolve dispute.
                </p>
              )}
            </div>
          )}

          {/* Resolution Result */}
          {resolution === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-green-800">
                  Resolved — Payment sent to Bob
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
              <p className="font-mono text-xs text-gray-600 break-all">{txHash}</p>
            </div>
          )}

          {resolution === "refunded" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-blue-800">
                  Resolved — Refund sent to Alice
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
              <p className="font-mono text-xs text-gray-600 break-all">{txHash}</p>
            </div>
          )}
        </section>
        )}

        {/* No Dispute Active */}
        {escrowStatus !== "DISPUTED" && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 text-center">
            <p className="text-sm text-gray-400">
              No active dispute at this time. Dispute resolution panel will appear when a dispute is raised.
            </p>
          </section>
        )}

        {/* Info when head not open */}
        {!isOpen && (
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Connect to an Open Hydra Head to perform dispute resolution.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
