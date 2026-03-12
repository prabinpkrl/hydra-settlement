"use client";

import { useState } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useEscrowStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { PARTY_ADDRESSES } from "@/lib/types";

export function SellerTab() {
  const [confirmed, setConfirmed] = useState(false);

  const headTag = useHeadState("bob");
  const { utxos, balance, loading } = usePartyUtxos("bob");
  const events = useTxLogStore((s) => s.events);

  const { status: escrowStatus, amount, disputeReason } = useEscrowStore();

  const isOpen = headTag === "Open";

  return (
    <div>
      {/* Identity */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-400 font-mono break-all">
          {PARTY_ADDRESSES.bob}
        </p>
        <HeadStatusBadge tag={headTag} />
      </div>

      {/* Incoming escrow banner */}
      {isOpen && !confirmed && escrowStatus === "PENDING" && (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-blue-900 mb-1">Payment incoming</h2>
          <p className="text-xs text-blue-600 mb-3">
            {amount ? `${(Number(amount) / 1_000_000).toFixed(2)} ADA` : `${(balance / 1_000_000).toFixed(2)} ADA`} locked by buyer. Confirm delivery to allow release.
          </p>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Confirm Delivery
          </button>
        </section>
      )}

      {/* Delivery confirmed */}
      {confirmed && escrowStatus === "PENDING" && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-green-800">Delivery confirmed!</p>
          <p className="text-xs text-green-600">Waiting for buyer to release payment.</p>
        </section>
      )}

      {/* Dispute banner */}
      {escrowStatus === "DISPUTED" && (
        <section className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-orange-800">Dispute raised</p>
          <p className="text-xs text-orange-600 mt-1">Reason: {disputeReason}</p>
          <p className="text-xs text-orange-500 mt-1">
            {amount ? `${(Number(amount) / 1_000_000).toFixed(2)} ADA` : ""} — Mediator is reviewing.
          </p>
        </section>
      )}

      {/* Payment complete */}
      {escrowStatus === "COMPLETED" && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-green-800">Payment released to you.</p>
          {amount && (
            <p className="text-xs text-green-600 mt-1">{(Number(amount) / 1_000_000).toFixed(2)} ADA</p>
          )}
        </section>
      )}

      <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

      {!isOpen && !loading && (
        <section className="bg-white border border-gray-200 rounded-lg p-5 text-center mb-5">
          <p className="text-sm text-gray-400">Waiting for Hydra Head to open.</p>
        </section>
      )}

      {/* Activity feed */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">My Activity</h2>
        <TransactionFeed
          events={events}
          filterParty="bob"
          emptyText="No transactions yet."
        />
      </div>
    </div>
  );
}
