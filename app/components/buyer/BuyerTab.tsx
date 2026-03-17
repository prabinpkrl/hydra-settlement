"use client";

import { useState, useEffect } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { useHeadActions } from "@/lib/hooks/useHeadActions";
import { useEscrowActions } from "@/lib/hooks/useEscrowActions";
import { useTxLogStore } from "@/lib/tx-log-store";
import { PARTY_ADDRESSES } from "@/lib/types";

export function BuyerTab() {
  const [activeTab, setActiveTab] = useState<"send" | "activity">("send");
  const escrows = useEscrowStore((s) => s.escrows);
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAddress, setFormAddress] = useState(PARTY_ADDRESSES["bob"]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [topMsg, setTopMsg] = useState({ type: "", text: "" });
  const [disputeModal, setDisputeModal] = useState<{ dealId: string; reason: string } | null>(null);
  const allEvents = useTxLogStore((s) => s.events);
  const events = allEvents.filter(
    (ev) =>
      ev.party === "alice" &&
      ev.kind !== "head_open" &&
      ev.kind !== "head_close",
  );

  // Get all active escrows (PENDING or DISPUTED)
  const activeEscrows = escrows.filter(e => e.status === "PENDING" || e.status === "DISPUTED");
  const isIdle = activeEscrows.length === 0;

  // Auto-dismiss top toast after 2 seconds
  useEffect(() => {
    if (topMsg.text) {
      const timer = setTimeout(() => setTopMsg({ type: "", text: "" }), 2000);
      return () => clearTimeout(timer);
    }
  }, [topMsg.text]);

  const toast = (message: string, ok: boolean) => {
    setMsg({ type: ok ? "success" : "error", text: message });
  };

  const topToast = (message: string, ok: boolean) => {
    setTopMsg({ type: ok ? "success" : "error", text: message });
  };

  const { lockFunds, releasePayment, raiseDispute } = useEscrowActions(toast, topToast);

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const lovelace = parseFloat(formAmount) * 1000000;
      await lockFunds(formAddress, lovelace, formDesc);
      setFormAmount("");
      setFormDesc("");
      setFormAddress(PARTY_ADDRESSES["bob"]);
    } catch (err) {
      setMsg({ type: "error", text: "Failed to lock funds. Check console." });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Toast Notification */}
      {topMsg.text && (
        <div className={`fixed top-4 left-4 right-4 p-4 rounded-lg text-white text-sm font-semibold z-50 ${topMsg.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {topMsg.text}
        </div>
      )}

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

      {/* Content */}
      {activeTab === "send" ? (
        <div className="space-y-4">
          {/* Active Escrows - Multiple Support */}
          {activeEscrows.length > 0 && (
            <div className="space-y-3">
              {activeEscrows.map((escrow) => (
                <div key={escrow.dealId} className="bg-blue-50 rounded-lg border border-[#3b82f6] p-8">
                  <div className="text-5xl font-bold text-[#1e293b] mb-3">
                    {(Number(escrow.amount) / 1000000).toFixed(2)} ADA
                  </div>
                  <p className="text-sm text-[#64748b] mb-2 font-medium">{escrow.description}</p>
                  <p className="text-xs text-[#94a3b8] mb-4">Deal ID: {escrow.dealId}</p>

                  {escrow.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => releasePayment(escrow.dealId)}
                        className="flex-1 bg-[#3b82f6] text-white px-4 py-3 rounded text-sm font-bold hover:bg-[#2563eb] transition-all"
                      >
                        Release
                      </button>
                      <button 
                        onClick={() => setDisputeModal({ dealId: escrow.dealId, reason: "" })}
                        className="flex-1 border border-[#cbd5e1] text-[#1e293b] px-4 py-3 rounded text-sm font-bold hover:bg-[#f1f5f9] transition-all"
                      >
                        Report Issue
                      </button>
                    </div>
                  )}

                  {escrow.status === "DISPUTED" && <p className="text-sm font-bold text-[#f59e0b]">Dispute in Review</p>}

                  {escrow.status === "COMPLETED" && (
                    <button 
                      onClick={() => useEscrowStore.getState().resetEscrow()}
                      className="text-[#3b82f6] text-sm font-bold hover:underline"
                    >
                      New Payment →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Payment Form */}
          {isIdle && (
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
                className="w-full bg-[#3b82f6] text-white py-2 rounded text-xs font-bold hover:bg-[#2563eb] disabled:bg-[#cbd5e1] transition-all"
              >
                {loading ? "Processing..." : "Send Secure Payment"}
              </button>

              {msg.text && (
                <p className={`text-xs text-center ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {msg.text}
                </p>
              )}
            </form>
          )}
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
                      return { label: "Received", color: "text-green-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
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
                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#1e293b] mb-4">Describe the Issue</h3>
            <textarea
              value={disputeModal.reason}
              onChange={(e) => setDisputeModal({ ...disputeModal, reason: e.target.value })}
              placeholder="What is the problem with this transaction?"
              className="w-full border border-[#e2e8f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setDisputeModal(null)}
                className="flex-1 border border-[#e2e8f0] text-[#1e293b] px-3 py-2 rounded text-sm font-bold hover:bg-[#f1f5f9]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  raiseDispute(disputeModal.dealId, disputeModal.reason || "Issue reported");
                  setDisputeModal(null);
                }}
                className="flex-1 bg-[#3b82f6] text-white px-3 py-2 rounded text-sm font-bold hover:bg-[#2563eb]"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
