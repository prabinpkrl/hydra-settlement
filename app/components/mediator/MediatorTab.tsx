"use client";

import { useState } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { useMediatorActions } from "@/lib/hooks/useMediatorActions";
import { PARTY_ADDRESSES } from "@/lib/types";
import { useToast } from "@/app/components/ui/useToast";

export function MediatorTab() {
  const [activeTab, setActiveTab] = useState<"incoming" | "disputes">("incoming");
  const escrows = useEscrowStore((s) => s.escrows);
  const toast = useToast();
  const { payBob, refundAlice, loading } = useMediatorActions(toast);

  // Get all pending and disputed escrows
  const pendingEscrows = escrows.filter(e => e.status === "PENDING");
  const disputedEscrows = escrows.filter(e => e.status === "DISPUTED");
  const completedEscrows = escrows.filter(e => e.status === "COMPLETED");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#e2e8f0]">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "incoming" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Incoming{" "}
          {pendingEscrows.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              {pendingEscrows.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "disputes" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Disputes{" "}
          {disputedEscrows.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
              {disputedEscrows.length}
            </span>
          )}
        </button>
      </div>

      {/* Incoming Tab - Show all PENDING escrows */}
      {activeTab === "incoming" ? (
        <div className="space-y-3">
          {pendingEscrows.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-8">
              <p className="text-sm text-center text-[#94a3b8]">No incoming escrows</p>
            </div>
          ) : (
            pendingEscrows.map((escrow) => (
              <div key={escrow.dealId} className="bg-white rounded-lg border border-[#e2e8f0] p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Amount</p>
                    <p className="text-3xl font-bold text-[#1e293b]">{(Number(escrow.amount) / 1000000).toFixed(2)} ADA</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Locked in Escrow
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Item</p>
                  <p className="text-sm text-[#1e293b]">{escrow.description}</p>
                </div>
                <p className="text-xs text-[#94a3b8]">Deal ID: {escrow.dealId}</p>
              </div>
            ))
          )}

          {/* Completed shown below */}
          {completedEscrows.map((escrow) => (
            <div key={escrow.dealId} className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-green-700">
                ✓ {(Number(escrow.amount) / 1000000).toFixed(2)} ADA — Resolved
              </span>
              <button
                onClick={() => useEscrowStore.getState().removeEscrow(escrow.dealId)}
                className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Disputes Tab - Show all DISPUTED escrows */
        <div className="space-y-3">
          {disputedEscrows.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-8">
              <p className="text-sm text-center text-[#94a3b8]">No active disputes</p>
            </div>
          ) : (
            disputedEscrows.map((escrow) => (
              <div key={escrow.dealId} className="bg-white rounded-lg border border-amber-200 p-6">
                {/* Summary */}
                <div className="mb-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Disputed Amount</p>
                      <p className="text-3xl font-bold text-[#1e293b]">{(Number(escrow.amount) / 1000000).toFixed(2)} ADA</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      Under Review
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Item</p>
                    <p className="text-sm text-[#1e293b]">{escrow.description}</p>
                  </div>
                  <p className="text-xs text-[#94a3b8] mb-3">Deal ID: {escrow.dealId}</p>
                  {escrow.disputeReason && (
                    <div className="pt-3 border-t border-[#e2e8f0]">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Issue Reported</p>
                      <p className="text-sm text-[#64748b] italic">"{escrow.disputeReason}"</p>
                    </div>
                  )}
                </div>

                {/* Resolution buttons */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#64748b]">Resolution:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => payBob(escrow.dealId, PARTY_ADDRESSES.bob, (Number(escrow.amount) / 1000000).toFixed(2))}
                      disabled={loading}
                      className="bg-[#3b82f6] text-white px-3 py-3 rounded-lg text-sm font-bold hover:bg-[#2563eb] disabled:bg-[#cbd5e1] transition-all"
                    >
                      {loading ? "Processing..." : "Pay Seller"}
                    </button>
                    <button
                      onClick={() => refundAlice(escrow.dealId, (Number(escrow.amount) / 1000000).toFixed(2))}
                      disabled={loading}
                      className="border border-[#e2e8f0] bg-white text-[#1e293b] px-3 py-3 rounded-lg text-sm font-bold hover:bg-[#f8fafc] disabled:bg-[#cbd5e1] transition-all"
                    >
                      {loading ? "Processing..." : "Refund Buyer"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
