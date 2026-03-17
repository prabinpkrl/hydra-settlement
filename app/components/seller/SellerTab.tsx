"use client";

import { useState } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { useToast } from "@/app/components/ui/useToast";

export function SellerTab() {
  const [activeTab, setActiveTab] = useState<"incoming" | "activity">("incoming");
  const escrows = useEscrowStore((s) => s.escrows);
  const toast = useToast();
  const allEvents = useTxLogStore((s) => s.events);
  const events = allEvents.filter(
    (ev) =>
      ev.party === "bob" &&
      ev.kind !== "head_open" &&
      ev.kind !== "head_close",
  );

  // Get all active escrows (PENDING or DISPUTED)
  const activeEscrows = escrows.filter(e => e.status === "PENDING" || e.status === "DISPUTED");
  const completedEscrows = escrows.filter(e => e.status === "COMPLETED");

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="flex gap-6 border-b border-[#e2e8f0]">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "incoming" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Incoming {activeEscrows.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              {activeEscrows.length}
            </span>
          )}
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
          {activeEscrows.length === 0 && completedEscrows.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-8">
              <p className="text-sm text-center text-[#94a3b8]">Waiting for payment...</p>
            </div>
          ) : (
            <>
              {/* Active escrows */}
              {activeEscrows.map((escrow) => (
                <div key={escrow.dealId} className={`rounded-lg border p-5 ${
                  escrow.status === "DISPUTED"
                    ? "bg-amber-50 border-amber-300"
                    : "bg-white border-[#e2e8f0]"
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-3xl font-bold text-[#1e293b]">
                        {(Number(escrow.amount) / 1000000).toFixed(2)} ADA
                      </div>
                      <p className="text-sm text-[#64748b] mt-1 font-medium">{escrow.description}</p>
                    </div>
                    {escrow.status === "PENDING" ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Locked in Escrow
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Dispute in Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8]">Deal ID: {escrow.dealId}</p>
                </div>
              ))}

              {/* Completed escrows */}
              {completedEscrows.map((escrow) => (
                <div key={escrow.dealId} className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-green-700">
                      ✓ {(Number(escrow.amount) / 1000000).toFixed(2)} ADA — Payment Received
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
            </>
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
                      return { label: "Incoming", color: "text-blue-600", amount: `${(ev.amount || 0) / 1000000} ADA` };
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
