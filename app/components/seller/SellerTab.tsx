"use client";

import { useState, useEffect } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useEscrowStore, useHeadProposalStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { HeadProposal } from "@/app/components/shared/HeadProposal";
import { PARTY_ADDRESSES } from "@/lib/types";

export function SellerTab() {
  const [confirmed, setConfirmed] = useState(false);

  const headTag = useHeadState("bob");
  const { utxos, balance, loading } = usePartyUtxos("bob");
  const events = useTxLogStore((s) => s.events);
  const { proposal, currentHeadId } = useHeadProposalStore();
  const { syncFromHead } = useEscrowStore();

  const { status: escrowStatus, amount, disputeReason } = useEscrowStore();

  const isOpen = headTag === "Open";
  const headNotInitialized = headTag === "Idle" || headTag === "...";

  // Auto-sync escrow from head storage when head is active
  useEffect(() => {
    if (currentHeadId && proposal?.status === "active") {
      const interval = setInterval(() => {
        syncFromHead(currentHeadId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentHeadId, proposal?.status, syncFromHead]);

  return (
    <div>
      {/* Identity */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">bob :: seller</p>
          <p className="text-xs font-mono text-zinc-700 break-all">{PARTY_ADDRESSES.bob}</p>
        </div>
        <div className="flex-shrink-0">
          <HeadStatusBadge tag={headTag} />
        </div>
      </div>

      {/* Head Coordination */}
      {headNotInitialized && proposal?.status !== "active" && (
        <HeadProposal party="bob" />
      )}

      {/* Incoming escrow banner */}
      {isOpen && !confirmed && escrowStatus === "PENDING" && (
        <section className="border border-blue-900 rounded bg-zinc-900 p-4 mb-4">
          <p className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">incoming_payment</p>
          <p className="text-xs font-mono text-zinc-400 mb-3">
            {amount ? `${(Number(amount) / 1_000_000).toFixed(2)} ADA` : `${(balance / 1_000_000).toFixed(2)} ADA`} locked by buyer — confirm delivery to allow release
          </p>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full border border-blue-800 text-blue-300 rounded px-3 py-2 text-xs font-mono text-left
              hover:bg-blue-950 transition-colors"
          >
            {'>'} confirm delivery
          </button>
        </section>
      )}

      {/* Delivery confirmed */}
      {confirmed && escrowStatus === "PENDING" && (
        <section className="border border-green-900 rounded bg-zinc-900 p-4 mb-4">
          <p className="text-xs font-mono text-green-400 mb-0.5">// delivery confirmed</p>
          <p className="text-xs font-mono text-zinc-600">// waiting for buyer to release payment...</p>
        </section>
      )}

      {/* Dispute banner */}
      {escrowStatus === "DISPUTED" && (
        <section className="border border-orange-900 rounded bg-zinc-900 p-4 mb-4">
          <p className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1">dispute_raised</p>
          <p className="text-xs font-mono text-zinc-500">reason: {disputeReason}</p>
          {amount && (
            <p className="text-xs font-mono text-zinc-600">{(Number(amount) / 1_000_000).toFixed(2)} ADA — mediator reviewing</p>
          )}
        </section>
      )}

      {/* Payment complete */}
      {escrowStatus === "COMPLETED" && (
        <section className="border border-green-900 rounded bg-zinc-900 p-4 mb-4">
          <p className="text-xs font-mono text-green-400 mb-0.5">// payment released to you</p>
          {amount && (
            <p className="text-xs font-mono text-zinc-500">{(Number(amount) / 1_000_000).toFixed(2)} ADA</p>
          )}
        </section>
      )}

      <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

      {!isOpen && !loading && (
        <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
          <p className="text-xs font-mono text-zinc-700">// waiting for hydra head to open</p>
        </section>
      )}

      {/* Activity feed */}
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">activity_log</p>
        <TransactionFeed events={events} filterParty="bob" emptyText="no transactions yet" />
      </div>
    </div>
  );
}
