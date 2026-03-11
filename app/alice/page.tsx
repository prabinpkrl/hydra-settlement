"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEscrowStore } from "@/lib/escrow-store";

type EscrowStatus = "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";

const HYDRA_URL = "http://localhost:8082";
const ALICE_ADDRESS = "addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4";
const BOB_ADDRESS   = "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k";

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

export default function AlicePage() {
  // ── Head + UTxO state ────────────────────────────────────────────────────
  const [headTag, setHeadTag] = useState("...");
  const [utxos,   setUtxos]   = useState<UtxoMap>({});
  const [balance, setBalance] = useState(0);

  // ── Transfer mode ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"direct" | "escrow">("direct");

  // ── Direct transfer state ────────────────────────────────────────────────
  const [directRecipient, setDirectRecipient] = useState("");
  const [directAmount,    setDirectAmount]    = useState("");
  const [directTxHash,    setDirectTxHash]    = useState("");

  // ── Escrow state (Zustand store) ─────────────────────────────────────────
  const { status: escrowStatus, amount: escrowAmount, description: escrowDesc, 
          recipientAddress: escrowRecipient, disputeReason, txHash, 
          setEscrow, resetEscrow } = useEscrowStore();
  
  // Local UI state for escrow
  const [escrowAmountInput, setEscrowAmountInput] = useState("");
  const [escrowDescInput,   setEscrowDescInput]   = useState("");
  const [escrowRecipientInput, setEscrowRecipientInput] = useState(BOB_ADDRESS);
  const [disputeInput,      setDisputeInput]      = useState("");
  const [showDispute,       setShowDispute]       = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [closing,  setClosing]  = useState(false);
  const [fanouting, setFanouting] = useState(false);

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
            if (u.address === ALICE_ADDRESS) {
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

  // ── Auto-reset escrow if data is invalid ────────────────────────────────
  useEffect(() => {
    // If escrow is PENDING but has no valid data (0 amount), reset to IDLE
    if (escrowStatus === "PENDING" && (!escrowAmount || Number(escrowAmount) === 0)) {
      console.log("[Escrow] Invalid PENDING state detected, resetting to IDLE");
      resetEscrow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowStatus, escrowAmount]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  /** Poll /hydra/query/head every 3s until `targetState` is reached. */
  async function pollUntil(targetState: string, timeoutMs = 300_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`${HYDRA_URL}/hydra/query/head`);
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
    } catch (err: any) {
      showToast(err?.message ?? "Network error", false);
    } finally {
      setFanouting(false);
    }
  }

  async function sendADA(from: string, toAddress: string, lovelace: number): Promise<string> {
    const res = await fetch("/api/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ from, toAddress, lovelace }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Send failed");
    return data.hash as string;
  }

  // ── DIRECT TRANSFER ──────────────────────────────────────────────────────
  async function handleDirectSend() {
    if (!directRecipient || !directAmount || loading) return;
    const lovelace = Math.round(Number(directAmount) * 1_000_000);
    if (lovelace <= 0) return;
    setLoading(true);
    try {
      const hash = await sendADA("alice", directRecipient, lovelace);
      setDirectTxHash(hash);
      showToast("Transfer sent!", true);
      setDirectRecipient("");
      setDirectAmount("");
    } catch (err: any) {
      showToast(err?.message ?? "Transfer failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── ESCROW: IDLE → PENDING (Lock funds - self-send) ─────────────────────
  async function handleLockFunds() {
    if (!escrowRecipientInput || !escrowAmountInput || !escrowDescInput || loading) return;
    const lovelace = Math.round(Number(escrowAmountInput) * 1_000_000);
    if (lovelace <= 0) return;
    setLoading(true);
    try {
      const hash = await sendADA("alice", ALICE_ADDRESS, lovelace);
      setEscrow({ 
        status: "PENDING", 
        amount: String(lovelace), 
        description: escrowDescInput, 
        recipientAddress: escrowRecipientInput,
        txHash: hash 
      });
      showToast("Funds locked in escrow!", true);
    } catch (err: any) {
      showToast(err?.message ?? "Lock failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── ESCROW: PENDING → COMPLETED (Release to recipient) ──────────────────
  async function handleRelease() {
    if (loading) return;
    const lovelace = Number(escrowAmount);
    setLoading(true);
    try {
      const hash = await sendADA("alice", escrowRecipient, lovelace);
      setEscrow({ status: "COMPLETED", txHash: hash });
      showToast("Payment released to recipient!", true);
    } catch (err: any) {
      showToast(err?.message ?? "Release failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── PENDING → DISPUTED ───────────────────────────────────────────────────
  function handleRaiseDispute() {
    if (!disputeInput.trim()) return;
    setEscrow({ status: "DISPUTED", disputeReason: disputeInput.trim() });
    setShowDispute(false);
    showToast("Dispute raised. Mediator notified.", false);
  }

  // ── ESCROW: COMPLETED → IDLE (Reset) ────────────────────────────────────
  function handleReset() {
    resetEscrow();
    setEscrowAmountInput("");
    setEscrowDescInput("");
    setEscrowRecipientInput(BOB_ADDRESS);
    setDisputeInput("");
    setShowDispute(false);
  }

  const isOpen = headTag === "Open";
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
              <h1 className="text-2xl font-bold text-gray-900">Alice</h1>
              <p className="text-sm text-gray-500">Sender</p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all">{ALICE_ADDRESS}</p>
            </div>
            <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor(headTag)} ${isOpen ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium text-gray-700">{headTag}</span>
            </span>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("direct")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
              mode === "direct"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Direct Transfer
          </button>
          <button
            onClick={() => setMode("escrow")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
              mode === "escrow"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Escrow Transfer
          </button>
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

        {/* ── DIRECT TRANSFER MODE ──────────────────────────────────────── */}
        {mode === "direct" && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Direct Transfer
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Recipient Address</label>
                <input
                  type="text"
                  value={directRecipient}
                  onChange={(e) => setDirectRecipient(e.target.value)}
                  placeholder="addr_test1..."
                  disabled={!isOpen || loading}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (ADA)</label>
                <input
                  type="number"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  disabled={!isOpen || loading}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <button
                onClick={handleDirectSend}
                disabled={!isOpen || !directRecipient || !directAmount || loading}
                className="mt-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : (
                  "Send Now"
                )}
              </button>
              {directTxHash && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                  <p className="text-xs font-semibold text-green-700 mb-1">Transfer Complete</p>
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{directTxHash}</p>
                </div>
              )}
              {!isOpen && (
                <p className="text-xs text-gray-400 text-center">Head must be Open to send transfers.</p>
              )}
            </div>
          </section>
        )}

        {/* ── ESCROW TRANSFER MODE ──────────────────────────────────────── */}
        {mode === "escrow" && (
          <>
            {/* ── IDLE: Lock Funds Form ─────────────────────────────────────── */}
        {escrowStatus === "IDLE" && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              New Escrow
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                    <label className="text-xs text-gray-500 mb-1 block">Recipient Address</label>
                    <input
                      type="text"
                      value={escrowRecipientInput}
                      onChange={(e) => setEscrowRecipientInput(e.target.value)}
                      placeholder="addr_test1..."
                      disabled={!isOpen || loading}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amount (ADA)</label>
                    <input
                      type="number"
                      value={escrowAmountInput}
                      onChange={(e) => setEscrowAmountInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      disabled={!isOpen || loading}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <input
                      type="text"
                      value={escrowDescInput}
                      onChange={(e) => setEscrowDescInput(e.target.value)}
                      placeholder="e.g. Freelance payment for logo design"
                      disabled={!isOpen || loading}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <button
                    onClick={handleLockFunds}
                    disabled={!isOpen || !escrowRecipientInput || !escrowAmountInput || !escrowDescInput || loading}
                    className="mt-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Locking...</>
                    ) : (
                      "Lock Funds"
                    )}
                  </button>
                  {!isOpen && (
                    <p className="text-xs text-gray-400 text-center">Head must be Open to lock funds.</p>
                  )}
                </div>
              </section>
            )}

        {/* ── PENDING: Awaiting Delivery ───────────────────────────────── */}
        {escrowStatus === "PENDING" && (
          <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Escrow Active</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-200">
                Awaiting Delivery
              </span>
            </div>

            <div className="bg-gray-50 rounded-md p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recipient</span>
                <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[60%]">
                  {escrowRecipient.slice(0, 12)}...{escrowRecipient.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">{(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-800 text-right max-w-[60%]">{escrowDesc}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lock Tx</span>
                <span className="font-mono text-xs text-gray-400">{txHash.slice(0, 10)}...{txHash.slice(-6)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRelease}
                disabled={!isOpen || loading}
                className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Releasing...</>
                ) : (
                  "Release Payment"
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-600 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Escrow
              </button>

              {!showDispute ? (
                <button
                  onClick={() => setShowDispute(true)}
                  disabled={loading}
                  className="w-full bg-orange-50 text-orange-700 border border-orange-200 rounded-md py-2 text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Raise Dispute
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500">Reason for dispute</label>
                  <textarea
                    value={disputeInput}
                    onChange={(e) => setDisputeInput(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRaiseDispute}
                      disabled={!disputeInput.trim() || loading}
                      className="flex-1 bg-orange-500 text-white rounded-md py-2 text-sm font-medium hover:bg-orange-400 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Submit Dispute
                    </button>
                    <button
                      onClick={() => { setShowDispute(false); setDisputeInput(""); }}
                      className="flex-1 bg-gray-100 text-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── DISPUTED ─────────────────────────────────────────────────── */}
        {escrowStatus === "DISPUTED" && (
          <section className="bg-white border border-orange-200 rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Dispute Raised</h2>
              <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200">
                Disputed
              </span>
            </div>

            <div className="bg-orange-50 rounded-md p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recipient</span>
                <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[60%]">
                  {escrowRecipient.slice(0, 12)}...{escrowRecipient.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">{(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-800 text-right max-w-[60%]">{escrowDesc}</span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <p className="text-xs font-semibold text-orange-700 mb-1">Dispute Reason</p>
              <p className="text-sm text-orange-800">{disputeReason}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-md p-3">
              <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Waiting for mediator (Carol) to resolve...
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Action buttons are locked during dispute resolution.
            </p>
          </section>
        )}

        {/* ── COMPLETED ────────────────────────────────────────────────── */}
        {escrowStatus === "COMPLETED" && (
          <section className="bg-white border border-green-200 rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Escrow Complete</h2>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                ✅ Completed
              </span>
            </div>

            <div className="bg-green-50 rounded-md p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recipient</span>
                <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[60%]">
                  {escrowRecipient.slice(0, 12)}...{escrowRecipient.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-semibold text-gray-900">{(Number(escrowAmount) / 1_000_000).toFixed(2)} ADA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-800 text-right max-w-[60%]">{escrowDesc}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Release Tx</span>
                <span className="font-mono text-xs text-gray-500 break-all text-right max-w-[60%]">{txHash}</span>
              </div>
            </div>

            <p className="text-sm text-green-700 text-center mb-4">
              Payment successfully released to recipient.
            </p>

            <button
              onClick={handleReset}
              className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Start New Escrow
            </button>
          </section>
        )}
          </>
        )}

      </div>
    </main>
  );
}
