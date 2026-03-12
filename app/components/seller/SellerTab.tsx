"use client";

import { useEffect } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useEscrowStore, useHeadProposalStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { HeadProposal } from "@/app/components/shared/HeadProposal";
import { IncomingEscrowList } from "@/app/components/seller/IncomingEscrowList";
import { PARTY_ADDRESSES } from "@/lib/types";

export function SellerTab() {
  const headTag = useHeadState("bob");
  const { utxos, balance, loading } = usePartyUtxos("bob");
  const events = useTxLogStore((s) => s.events);
  const { proposal, currentHeadId } = useHeadProposalStore();
  const { escrows, syncFromHead } = useEscrowStore();

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

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Status and balance */}
        <div className="space-y-4">
          <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

          <IncomingEscrowList escrows={escrows} myAddress={PARTY_ADDRESSES.bob} />

          {!isOpen && !loading && (
            <section className="border border-zinc-800 rounded bg-zinc-900 p-4">
              <p className="text-xs font-mono text-zinc-700">// waiting for hydra head to open</p>
            </section>
          )}
        </div>

        {/* Right column - Activity feed */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">activity_log</p>
            <TransactionFeed events={events} filterParty="bob" emptyText="no transactions yet" />
          </div>
        </div>
      </div>
    </div>
  );
}
