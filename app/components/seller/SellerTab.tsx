"use client";

import { useState } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useTxLogStore } from "@/lib/tx-log-store";

export function SellerTab() {
  const [activeTab, setActiveTab] = useState<"incoming" | "activity">("incoming");
  const escrows = useEscrowStore((s) => s.escrows);
  const allEvents = useTxLogStore((s) => s.events);
  const events = allEvents.filter(
    (ev) =>
      ev.party === "bob" &&
      ev.kind !== "head_open" &&
      ev.kind !== "head_close",
  );

  // Compute active escrow from escrows array
  const activeEscrow = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
  const status = activeEscrow?.status || "IDLE";
  const amount = activeEscrow?.amount || "0";
  const description = activeEscrow?.description || "";

  return (
    <div className="space-y-4">
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
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
          {status === "IDLE" ? (
            <p className="text-xs text-center text-[#94a3b8]">Waiting for payment...</p>
          ) : (
            <div>
              <div className="text-3xl font-bold text-[#1e293b] mb-2">
                {(Number(amount) / 1000000).toFixed(2)} ADA
              </div>
              <p className="text-xs text-[#64748b] mb-4">{description}</p>

              {status === "PENDING" && (
                <div className="inline-block px-2 py-1 bg-blue-50 border border-[#3b82f6] rounded text-xs font-bold text-[#3b82f6]">
                  Locked in Escrow
                </div>
              )}

              {status === "DISPUTED" && (
                <div className="inline-block px-2 py-1 bg-yellow-50 border border-[#f59e0b] rounded text-xs font-bold text-[#f59e0b]">
                  Dispute in Review
                </div>
              )}

              {status === "COMPLETED" && (
                <div className="space-y-2">
                  <div className="inline-block px-2 py-1 bg-green-50 border border-green-600 rounded text-xs font-bold text-green-600">
                    Payment Received
                  </div>
                  <button 
                    onClick={() => useEscrowStore.getState().resetEscrow()}
                    className="text-[#3b82f6] text-xs font-bold hover:underline ml-3"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
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
                    case "escrow_lock": return `Received ${(ev.amount || 0) / 1000000} ADA`;
                    case "escrow_release": return `Payment released`;
                    case "escrow_dispute": return `Buyer reported issue`;
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
