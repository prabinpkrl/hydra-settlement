"use client";

import { useState, useEffect } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useTxLogStore } from "@/lib/tx-log-store";

export function SellerTab() {
  const [activeTab, setActiveTab] = useState<"incoming" | "activity">("incoming");
  const escrows = useEscrowStore((s) => s.escrows);
  const [topMsg, setTopMsg] = useState({ type: "", text: "" });
  const allEvents = useTxLogStore((s) => s.events);
  const events = allEvents.filter(
    (ev) =>
      ev.party === "bob" &&
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
          onClick={() => setActiveTab("incoming")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "incoming" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Incoming
        </button>
        <button 
          onClick={() => setActiveTab("activity")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "activity" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          History
        </button>
      </div>

      {/* Content */}
      {activeTab === "incoming" ? (
        <div className="space-y-3">
          {activeEscrows.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-8">
              <p className="text-sm text-center text-[#94a3b8]">Waiting for payment...</p>
            </div>
          ) : (
            activeEscrows.map((escrow) => (
              <div key={escrow.dealId} className="bg-white rounded-lg border border-[#e2e8f0] p-8">
                <div className="text-5xl font-bold text-[#1e293b] mb-3">
                  {(Number(escrow.amount) / 1000000).toFixed(2)} ADA
                </div>
                <p className="text-sm text-[#64748b] mb-2 font-medium">{escrow.description}</p>
                <p className="text-xs text-[#94a3b8] mb-4">Deal ID: {escrow.dealId}</p>

                {escrow.status === "PENDING" && (
                  <div className="inline-block px-3 py-2 bg-blue-50 border border-[#3b82f6] rounded text-sm font-bold text-[#3b82f6]">
                    Locked in Escrow
                  </div>
                )}

                {escrow.status === "DISPUTED" && (
                  <div className="inline-block px-3 py-2 bg-yellow-50 border border-[#f59e0b] rounded text-sm font-bold text-[#f59e0b]">
                    Dispute in Review
                  </div>
                )}

                {escrow.status === "COMPLETED" && (
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-2 bg-green-50 border border-green-600 rounded text-sm font-bold text-green-600">
                      Payment Received
                    </div>
                    <button 
                      onClick={() => useEscrowStore.getState().resetEscrow()}
                      className="text-[#3b82f6] text-sm font-bold hover:underline ml-3"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
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
    </div>
  );
}
