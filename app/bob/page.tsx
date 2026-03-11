"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEscrowStore } from "@/lib/escrow-store";

const HYDRA_URL   = "http://localhost:8083";
const BOB_ADDRESS = "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k";

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

export default function BobPage() {
  // ── Head + UTxO state ────────────────────────────────────────────────────
  const [headTag,  setHeadTag]  = useState("...");
  const [utxos,    setUtxos]    = useState<UtxoMap>({});
  const [balance,  setBalance]  = useState(0);
  const [loading,  setLoading]  = useState(true);

  // ── Escrow delivery state ────────────────────────────────────────────────
  const [confirmed, setConfirmed] = useState(false);
  
  // ── Escrow store state ───────────────────────────────────────────────────
  const { status: escrowStatus, amount: escrowAmount, disputeReason } = useEscrowStore();

  // ── Head polling ─────────────────────────────────────────────────────────
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
            if (u.address === BOB_ADDRESS) {
              mine[ref] = u;
              total += u.value?.lovelace ?? 0;
            }
          }
          setUtxos(mine);
          setBalance(total);
        }
      } catch {
        setHeadTag("Offline");
      } finally {
        setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const isOpen      = headTag === "Open";
  const utxoEntries = Object.entries(utxos);
  const hasIncoming = utxoEntries.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto py-12 px-6">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</Link>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bob</h1>
              <p className="text-sm text-gray-500">Receiver</p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all">{BOB_ADDRESS}</p>
            </div>
            <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor(headTag)} ${isOpen ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium text-gray-700">{headTag}</span>
            </span>
          </div>
        </div>

        {/* Incoming Payment Banner */}
        {isOpen && hasIncoming && !confirmed && escrowStatus === "PENDING" && (
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-blue-900">Payment incoming. Waiting for your delivery confirmation.</h2>
                <p className="text-xs text-blue-600">
                  {escrowAmount ? `${(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA` : `${(balance / 1_000_000).toFixed(2)} ADA`} available at your address
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmed(true)}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Delivery
            </button>
          </section>
        )}

        {/* Delivery Confirmed Banner */}
        {confirmed && escrowStatus === "PENDING" && (
          <section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-green-800">Delivery confirmed!</p>
              <p className="text-xs text-green-600">Waiting for sender to release payment.</p>
            </div>
          </section>
        )}

        {/* Dispute Banner */}
        {escrowStatus === "DISPUTED" && (
          <section className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-800">Dispute raised</p>
                <p className="text-xs text-orange-600 mt-1">Reason: {disputeReason}</p>
                <p className="text-xs text-orange-500 mt-1">Amount: {escrowAmount ? `${(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA` : 'N/A'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Payment Complete Banner */}
        {escrowStatus === "COMPLETED" && (
          <section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-green-800">Payment released to you.</p>
                <p className="text-xs text-green-600 mt-1">Amount: {escrowAmount ? `${(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA` : 'N/A'}</p>
              </div>
            </div>
          </section>
        )}

        {/* L2 Balance */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">L2 Balance</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : !isOpen ? (
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

        {/* Info card when head isn't open */}
        {!isOpen && !loading && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 text-center">
            <p className="text-sm text-gray-400">
              Waiting for Hydra Head to open before escrow payments can be received.
            </p>
          </section>
        )}

      </div>
    </main>
  );
}
