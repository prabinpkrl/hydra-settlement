"use client";

import { useEscrowStore } from "@/lib/escrow-store";
import { useMediatorActions } from "@/lib/hooks/useMediatorActions";

export function MediatorTab() {
  const { status, amount, description, disputeReason, dealId } = useEscrowStore();
  const { payBob, refundAlice, loading } = useMediatorActions((msg: string, ok: boolean) => {});

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-8">
      <h2 className="text-lg font-bold text-[#1e293b] mb-6">Dispute Resolution</h2>

      {status !== "DISPUTED" ? (
        <p className="text-[#64748b] italic text-center py-8">
          No active disputes to resolve
        </p>
      ) : (
        <div className="space-y-6">
          {/* Disputed Payment Details */}
          <div className="p-6 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-2">Disputed Amount</p>
              <p className="text-3xl font-bold text-[#1e293b]">{(Number(amount) / 1000000).toFixed(2)} ADA</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Item</p>
              <p className="text-sm text-[#1e293b]">{description}</p>
            </div>

            {disputeReason && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-1">Issue Reported</p>
                <p className="text-sm text-[#64748b] italic">"{disputeReason}"</p>
              </div>
            )}
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <p className="text-sm text-[#64748b]">Choose resolution:</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => payBob(dealId, "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k", (Number(amount) / 1000000).toFixed(2))}
                disabled={loading}
                className="bg-[#3b82f6] text-white px-4 py-4 rounded-lg text-sm font-bold hover:bg-[#2563eb] disabled:bg-[#cbd5e1] transition-all"
              >
                {loading ? "Processing..." : "Pay Seller"}
              </button>
              <button 
                onClick={() => refundAlice(dealId, (Number(amount) / 1000000).toFixed(2))}
                disabled={loading}
                className="border border-[#e2e8f0] bg-white text-[#1e293b] px-4 py-4 rounded-lg text-sm font-bold hover:bg-[#f8fafc] disabled:bg-[#cbd5e1] transition-all"
              >
                {loading ? "Processing..." : "Refund Buyer"}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#64748b] text-center">
            Resolution is final and triggers instant Layer 2 payment
          </p>
        </div>
      )}
    </div>
  );
}
