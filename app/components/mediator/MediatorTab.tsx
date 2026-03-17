"use client";

import { useState } from "react";
import { useEscrowStore } from "@/lib/escrow-store";
import { useMediatorActions } from "@/lib/hooks/useMediatorActions";
import { PARTY_ADDRESSES } from "@/lib/types";

export function MediatorTab() {
  const [activeTab, setActiveTab] = useState<"incoming" | "disputes">("incoming");
  const escrows = useEscrowStore((s) => s.escrows);
  const [toastMsg, setToastMsg] = useState({ type: "", text: "" });
  const { payBob, refundAlice, loading } = useMediatorActions((msg: string, ok: boolean) => {
    setToastMsg({ type: ok ? "success" : "error", text: msg });
  });

  // Get all pending and disputed escrows
  const pendingEscrows = escrows.filter(e => e.status === "PENDING");
  const disputedEscrows = escrows.filter(e => e.status === "DISPUTED");

  return (
    <div className="space-y-4">
      {/* Top Toast */}
      {toastMsg.text && (
        <div className={`fixed top-4 left-4 right-4 p-4 rounded-lg text-white text-sm font-semibold z-50 ${toastMsg.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#e2e8f0]">
        <button 
          onClick={() => setActiveTab("incoming")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "incoming" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Incoming ({pendingEscrows.length})
        </button>
        <button 
          onClick={() => setActiveTab("disputes")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "disputes" ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
        >
          Disputes ({disputedEscrows.length})
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
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Amount</p>
                  <p className="text-3xl font-bold text-[#1e293b]">{(Number(escrow.amount) / 1000000).toFixed(2)} ADA</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Item</p>
                  <p className="text-sm text-[#1e293b]">{escrow.description}</p>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Deal ID</p>
                  <p className="text-xs text-[#64748b]">{escrow.dealId}</p>
                </div>
                <div className="inline-block px-2 py-1 bg-blue-50 border border-[#3b82f6] rounded text-xs font-bold text-[#3b82f6]">
                  Locked in Escrow
                </div>
              </div>
            ))
          )}
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
              <div key={escrow.dealId} className="bg-white rounded-lg border border-[#e2e8f0] p-6">
                <div className="mb-4 p-4 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Disputed Amount</p>
                    <p className="text-3xl font-bold text-[#1e293b]">{(Number(escrow.amount) / 1000000).toFixed(2)} ADA</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Item</p>
                    <p className="text-sm text-[#1e293b]">{escrow.description}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Deal ID</p>
                    <p className="text-xs text-[#64748b]">{escrow.dealId}</p>
                  </div>
                  {escrow.disputeReason && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Issue Reported</p>
                      <p className="text-sm text-[#64748b] italic">"{escrow.disputeReason}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#64748b]">Resolution:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => payBob(escrow.dealId, PARTY_ADDRESSES.bob, (Number(escrow.amount) / 1000000).toFixed(2))}
                      disabled={loading}
                      className="bg-[#3b82f6] text-white px-3 py-3 rounded text-sm font-bold hover:bg-[#2563eb] disabled:bg-[#cbd5e1] transition-all"
                    >
                      {loading ? "Processing..." : "Pay Seller"}
                    </button>
                    <button 
                      onClick={() => refundAlice(escrow.dealId, (Number(escrow.amount) / 1000000).toFixed(2))}
                      disabled={loading}
                      className="border border-[#e2e8f0] bg-white text-[#1e293b] px-3 py-3 rounded text-sm font-bold hover:bg-[#f8fafc] disabled:bg-[#cbd5e1] transition-all"
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
