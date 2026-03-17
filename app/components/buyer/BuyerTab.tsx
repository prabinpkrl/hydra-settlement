"use client";

import { useState } from "react";
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
  const allEvents = useTxLogStore((s) => s.events);
  const events = allEvents.filter(
    (ev) =>
      ev.party === "alice" &&
      ev.kind !== "head_open" &&
      ev.kind !== "head_close",
  );

  // Compute active escrow from escrows array
  const activeEscrow = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
  const status = activeEscrow?.status || "IDLE";
  const amount = activeEscrow?.amount || "0";
  const description = activeEscrow?.description || "";
  const dealId = activeEscrow?.dealId || "";

  const toast = (message: string, ok: boolean) => {
    setMsg({ type: ok ? "success" : "error", text: message });
  };

  const { lockFunds, releasePayment, raiseDispute } = useEscrowActions(toast);

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
          {/* Active Payment */}
          {status !== "IDLE" && (
            <div className="bg-blue-50 rounded-lg border border-[#3b82f6] p-6">
              <div className="text-3xl font-bold text-[#1e293b] mb-2">
                {(Number(amount) / 1000000).toFixed(2)} ADA
              </div>
              <p className="text-xs text-[#64748b] mb-4">{description}</p>

              {status === "PENDING" && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => releasePayment(dealId)}
                    className="flex-1 bg-[#3b82f6] text-white px-3 py-2 rounded text-xs font-bold hover:bg-[#2563eb] transition-all"
                  >
                    Release
                  </button>
                  <button 
                    onClick={() => raiseDispute(dealId, "Item not as described")}
                    className="flex-1 border border-[#cbd5e1] text-[#1e293b] px-3 py-2 rounded text-xs font-bold hover:bg-[#f1f5f9] transition-all"
                  >
                    Report Issue
                  </button>
                </div>
              )}

              {status === "DISPUTED" && <p className="text-xs font-bold text-[#f59e0b]">Dispute in Review</p>}

              {status === "COMPLETED" && (
                <button 
                  onClick={() => useEscrowStore.getState().resetEscrow()}
                  className="text-[#3b82f6] text-xs font-bold hover:underline"
                >
                  New Payment →
                </button>
              )}
            </div>
          )}

          {/* Payment Form */}
          {status === "IDLE" && (
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
            <p className="p-6 text-xs text-center text-[#94a3b8]">No history</p>
          ) : (
            <div className="divide-y divide-[#e2e8f0]">
              {events.map((ev, i) => {
                const getMessage = () => {
                  switch (ev.kind) {
                    case "escrow_lock": return `Sent ${(ev.amount || 0) / 1000000} ADA`;
                    case "escrow_release": return `Released payment`;
                    case "escrow_dispute": return `Disputed payment`;
                    default: return ev.kind;
                  }
                };
                return (
                  <div key={i} className="p-4 text-xs">
                    <p className="font-bold text-[#1e293b]">{getMessage()}</p>
                    <p className="text-[#94a3b8] mt-1">{new Date(ev.timestamp).toLocaleDateString()}</p>
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
