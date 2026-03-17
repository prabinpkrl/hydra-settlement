"use client";

import { useState } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { useEscrowActions } from "@/lib/hooks/useEscrowActions";
import { useTxLogStore } from "@/lib/tx-log-store";
import { PARTY_ADDRESSES } from "@/lib/types";
import { useToast } from "@/app/components/ui/useToast";

export function BuyerTab() {
  const [activeTab, setActiveTab] = useState<"send" | "activity">("send");
  const escrows = useEscrowStore((s) => s.escrows);
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAddress, setFormAddress] = useState(PARTY_ADDRESSES["bob"]);
  const [loading, setLoading] = useState(false);
  // inline dispute state: maps dealId → reason string (undefined = not showing)
  const [disputeForms, setDisputeForms] = useState<Record<string, string>>({});
  const allEvents = useTxLogStore((s) => s.events);
  const toast = useToast();

  const events = allEvents.filter(
    (ev) =>
      ev.party === "alice" &&
      ev.kind !== "head_open" &&
      ev.kind !== "head_close",
  );

  const activeEscrows = escrows.filter(e => e.status === "PENDING" || e.status === "DISPUTED");
  const completedEscrows = escrows.filter(e => e.status === "COMPLETED");

  const { lockFunds, releasePayment, raiseDispute } = useEscrowActions(
    (msg, ok) => toast(msg, ok),
  );

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const lovelace = parseFloat(formAmount) * 1000000;
      await lockFunds(formAddress, lovelace, formDesc);
      setFormAmount("");
      setFormDesc("");
      setFormAddress(PARTY_ADDRESSES["bob"]);
    } catch {
      toast("Failed to lock funds. Check console.", false);
    }
    setLoading(false);
  };

  const openDispute = (dealId: string) => {
    setDisputeForms(prev => ({ ...prev, [dealId]: "" }));
  };

  const closeDispute = (dealId: string) => {
    setDisputeForms(prev => {
      const next = { ...prev };
      delete next[dealId];
      return next;
    });
  };

  const submitDispute = async (dealId: string) => {
    const reason = disputeForms[dealId] ?? "";
    await raiseDispute(dealId, reason || "Issue reported");
    closeDispute(dealId);
  };

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="flex gap-6 border-b border-[#e2e8f0]">
        <button
          onClick={() => setActiveTab("send")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "send" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Send
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "activity" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          History
        </button>
      </div>

      {activeTab === "send" ? (
        <div className="space-y-4">

          {/* ── Active Escrow Cards ─────────────────────────────────────────── */}
          {activeEscrows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
                Active Escrows ({activeEscrows.length})
              </p>

              {activeEscrows.map((escrow) => {
                const isShowingDispute = escrow.dealId in disputeForms;

                return (
                  <div
                    key={escrow.dealId}
                    className={`rounded-lg border p-5 ${
                      escrow.status === "DISPUTED"
                        ? "bg-amber-50 border-amber-300"
                        : "bg-blue-50 border-[#3b82f6]"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-3xl font-bold text-[#1e293b]">
                          {(Number(escrow.amount) / 1000000).toFixed(2)} ADA
                        </div>
                        <p className="text-sm text-[#64748b] mt-1 font-medium">{escrow.description}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                        escrow.status === "DISPUTED"
                          ? "bg-amber-100 text-amber-700 border border-amber-300"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                      }`}>
                        {escrow.status === "DISPUTED" ? "Dispute in Review" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-3">Deal ID: {escrow.dealId}</p>

                    {/* PENDING — action buttons */}
                    {escrow.status === "PENDING" && !isShowingDispute && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => releasePayment(escrow.dealId)}
                          className="flex-1 bg-[#3b82f6] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#2563eb] transition-all"
                        >
                          Release Payment
                        </button>
                        <button
                          onClick={() => openDispute(escrow.dealId)}
                          className="flex-1 border border-[#cbd5e1] text-[#1e293b] px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#f1f5f9] transition-all"
                        >
                          Report Issue
                        </button>
                      </div>
                    )}

                    {/* Inline dispute form — shown inside card after "Report Issue" */}
                    {escrow.status === "PENDING" && isShowingDispute && (
                      <div className="mt-2 space-y-2 border-t border-[#e2e8f0] pt-3">
                        <p className="text-xs font-semibold text-[#64748b]">Describe the issue:</p>
                        <textarea
                          value={disputeForms[escrow.dealId]}
                          onChange={e =>
                            setDisputeForms(prev => ({ ...prev, [escrow.dealId]: e.target.value }))
                          }
                          placeholder="What is the problem with this transaction?"
                          rows={3}
                          className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] resize-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitDispute(escrow.dealId)}
                            className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-all"
                          >
                            Submit Dispute
                          </button>
                          <button
                            onClick={() => closeDispute(escrow.dealId)}
                            className="flex-1 border border-[#e2e8f0] text-[#64748b] px-3 py-2 rounded-lg text-sm font-bold hover:bg-[#f1f5f9] transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Completed Escrows ───────────────────────────────────────────── */}
          {completedEscrows.length > 0 && (
            <div className="space-y-2">
              {completedEscrows.map((escrow) => (
                <div key={escrow.dealId} className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-green-700">
                      ✓ {(Number(escrow.amount) / 1000000).toFixed(2)} ADA Released
                    </span>
                    <p className="text-xs text-[#64748b] mt-0.5">{escrow.description}</p>
                  </div>
                  <button
                    onClick={() => useEscrowStore.getState().removeEscrow(escrow.dealId)}
                    className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Divider when active escrows exist ──────────────────────────── */}
          {activeEscrows.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-[#e2e8f0]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
                New Payment
              </span>
              <div className="flex-1 h-px bg-[#e2e8f0]" />
            </div>
          )}

          {/* ── Payment Form — always visible ───────────────────────────────── */}
          <form onSubmit={handleLock} className="space-y-3 bg-white p-6 rounded-lg border border-[#e2e8f0]">
            <div>
              <input
                type="text"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="Seller address"
                className="w-full border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
            <div>
              <input
                type="number"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="Amount (ADA)"
                className="w-full border border-[#e2e8f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Item description"
                className="w-full border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b82f6] text-white py-2.5 rounded text-xs font-bold hover:bg-[#2563eb] disabled:bg-[#cbd5e1] transition-all"
            >
              {loading ? "Processing..." : "Send Secure Payment"}
            </button>
          </form>

        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#e2e8f0]">
          {events.length === 0 ? (
            <p className="p-8 text-xs text-center text-[#94a3b8]">No transactions yet</p>
          ) : (
            <div>
              {events.map((ev, i) => {
                const getTypeInfo = () => {
                  switch (ev.kind) {
                    case "escrow_lock":
                      return { label: "Sent", color: "text-red-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
                    case "escrow_release":
                      return { label: "Released", color: "text-green-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
                    case "escrow_dispute":
                      return { label: "Disputed", color: "text-yellow-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
                    case "direct_send":
                      return { label: "Sent", color: "text-red-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
                    default:
                      return { label: ev.kind, color: "text-gray-600", amount: "" };
                  }
                };
                const formatTime = (timestamp: string | number) => {
                  const date = new Date(timestamp);
                  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  return `${dateStr} · ${timeStr}`;
                };
                const info = getTypeInfo();
                return (
                  <div key={i} className="py-4 px-4 border-b border-[#f1f5f9]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-xs font-semibold ${info.color} mb-1`}>{info.label}</p>
                        <p className="text-sm font-bold text-[#1e293b]">{info.amount}</p>
                      </div>
                      <p className="text-xs text-[#94a3b8]">{formatTime(ev.timestamp)}</p>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1">Layer 2 · Instant · Saved ~0.17 ADA</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
