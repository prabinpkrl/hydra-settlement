"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const ROLES: Record<string, string> = {
  alice: "Sender",
  bob:   "Receiver",
  carol: "Mediator",
};

type UtxoMap = Record<string, { address: string; value: { lovelace: number } }>;

function statusColor(tag: string) {
  if (tag === "Open")   return "bg-green-500";
  if (tag === "Initial") return "bg-yellow-400";
  if (tag === "Idle")   return "bg-gray-400";
  if (tag === "Closed" || tag === "Final") return "bg-red-400";
  return "bg-gray-300";
}

function shortRef(ref: string) {
  const [hash, idx] = ref.split("#");
  return `${hash.slice(0, 8)}...${hash.slice(-4)}#${idx}`;
}

interface Props {
  party: "alice" | "bob" | "carol";
}

export default function PartyDashboard({ party }: Props) {
  const [headTag, setHeadTag]   = useState("...");
  const [utxos, setUtxos]       = useState<UtxoMap>({});
  const [balance, setBalance]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount]     = useState("");
  const [sending, setSending]   = useState(false);
  const [closing, setClosing]   = useState(false);
  const [fanouting, setFanouting] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const hydraUrl = HYDRA_URLS[party];
  const myAddress = PARTY_ADDRESSES[party];
  const role = ROLES[party];

  // Extract poll so it can be called manually after a send
  async function poll() {
    try {
      const [headRes, utxoRes] = await Promise.all([
        fetch(`${hydraUrl}/hydra/query/head`),
        fetch(`${hydraUrl}/hydra/query/utxo`),
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
          if (u.address === myAddress) {
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

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydraUrl, myAddress, refreshTick]);

  /** Poll /hydra/query/head every 3s until `targetState` is reached. */
  async function pollUntil(targetState: string, timeoutMs = 300_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`${HYDRA_URLS.alice}/hydra/query/head`);
        if (res.ok) {
          const body = await res.json();
          const s = body.tag ?? body.state ?? "";
          setHeadTag(s);
          if (s === targetState) return true;
        }
      } catch { /* keep polling */ }
    }
    return false;
  }

  async function closeHead() {
    if (closing) return;
    setClosing(true);
    try {
      const res  = await fetch("/api/close", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { showToast(data.error ?? "Close failed", false); return; }
      showToast("Close submitted — waiting for FanoutPossible...", true);
      const reached = await pollUntil("FanoutPossible");
      if (reached) {
        showToast("Head closed! Fanout is now available.", true);
      } else {
        showToast("Timed out waiting for FanoutPossible.", false);
      }
      setRefreshTick((t) => t + 1);
    } catch (err: any) {
      showToast(err?.message ?? "Network error", false);
    } finally {
      setClosing(false);
    }
  }

  async function fanoutHead() {
    if (fanouting) return;
    setFanouting(true);
    try {
      const res  = await fetch("/api/fanout", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { showToast(data.error ?? "Fanout failed", false); return; }
      showToast("Fanout submitted — waiting for Final...", true);
      const reached = await pollUntil("Final");
      if (reached) {
        showToast("Head closed! Funds settled on L1.", true);
      } else {
        showToast("Timed out waiting for Final.", false);
      }
      setRefreshTick((t) => t + 1);
    } catch (err: any) {
      showToast(err?.message ?? "Network error", false);
    } finally {
      setFanouting(false);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSend() {
    if (!toAddress || !amount || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          from:      party,
          toAddress: toAddress,
          lovelace:  Math.round(Number(amount) * 1_000_000),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Sent! Tx: ${String(data.hash).slice(0, 12)}...`, true);
        setRefreshTick((t) => t + 1);
      } else {
        showToast(data.error ?? "Send failed", false);
      }
    } catch (err: any) {
      showToast(err?.message ?? "Network error", false);
    } finally {
      setSending(false);
    }
  }

  async function sendToBob() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          from:      "alice",
          toAddress: PARTY_ADDRESSES.bob,
          lovelace:  5_000_000,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Sent 5 ADA to Bob! Tx: ${String(data.hash).slice(0, 12)}...`, true);
        setRefreshTick((t) => t + 1);
      } else {
        showToast(data.error ?? "Send failed", false);
      }
    } catch (err: any) {
      showToast(err?.message ?? "Network error", false);
    } finally {
      setSending(false);
    }
  }

  const utxoEntries = Object.entries(utxos);
  const isOpen = headTag === "Open";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto py-12 px-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</Link>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{party}</h1>
              <p className="text-sm text-gray-500">{role}</p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all">{myAddress}</p>
            </div>
            <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor(headTag)} ${isOpen ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium text-gray-700">{headTag}</span>
            </span>
          </div>
        </div>

        {/* Head Controls */}
        {(isOpen || headTag === "FanoutPossible") && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Head Controls</h2>
            <div className="flex flex-col gap-3">
              {isOpen && (
                <button
                  onClick={closeHead}
                  disabled={closing || fanouting}
                  className="w-full bg-orange-500 text-white rounded-md py-2 text-sm font-medium hover:bg-orange-400 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {closing ? (
                    <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Closing...</>
                  ) : (
                    "Close Head"
                  )}
                </button>
              )}
              {headTag === "FanoutPossible" && (
                <button
                  onClick={fanoutHead}
                  disabled={fanouting || closing}
                  className="w-full bg-emerald-600 text-white rounded-md py-2 text-sm font-medium hover:bg-emerald-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {fanouting ? (
                    <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Fanning out...</>
                  ) : (
                    "Fanout"
                  )}
                </button>
              )}
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
                {(balance / 1_000_000).toFixed(2)} <span className="text-base font-normal text-gray-500">ADA</span>
              </div>
              <div className="flex flex-col gap-2">
                {utxoEntries.map(([ref, u]) => (
                  <div key={ref} className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="font-mono text-gray-500 text-xs">{shortRef(ref)}</span>
                    <span className="text-gray-800 font-medium">{(u.value.lovelace / 1_000_000).toFixed(2)} ADA</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Send ADA */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Send ADA (L2)</h2>

          {/* Alice-only quick-send button */}
          {party === "alice" && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <button
                onClick={sendToBob}
                disabled={!isOpen || sending}
                className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : (
                  "Send 5 ADA → Bob"
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Recipient address</label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="addr_test1..."
                disabled={!isOpen || sending}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount (ADA)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                disabled={!isOpen || sending}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!isOpen || !toAddress || !amount || sending}
              className="mt-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
              ) : (
                "Send"
              )}
            </button>
            {!isOpen && (
              <p className="text-xs text-gray-400 text-center">Head must be Open to send.</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
