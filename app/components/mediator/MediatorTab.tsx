"use client";

import { useState, useEffect } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useMediatorActions } from "@/lib/hooks/useMediatorActions";
import { useEscrowStore, useHeadProposalStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { Toast } from "@/app/components/ui/Toast";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { HeadProposal } from "@/app/components/shared/HeadProposal";
import { DisputeList } from "@/app/components/mediator/DisputeList";
import { PARTY_ADDRESSES } from "@/lib/types";

export function MediatorTab() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const headTag = useHeadState("carol");
  const { utxos, balance, loading } = usePartyUtxos("carol");
  const events = useTxLogStore((s) => s.events);
  const mediator = useMediatorActions(showToast);
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
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Identity */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">carol :: mediator</p>
          <p className="text-xs font-mono text-zinc-700 break-all">{PARTY_ADDRESSES.carol}</p>
        </div>
        <div className="flex-shrink-0">
          <HeadStatusBadge tag={headTag} />
        </div>
      </div>

      {/* Head Coordination */}
      {headNotInitialized && proposal?.status !== "active" && (
        <HeadProposal party="carol" />
      )}

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Balance and dispute resolution */}
        <div className="space-y-4">
          <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

          <DisputeList
            escrows={escrows}
            isOpen={isOpen}
            loading={mediator.loading}
            onPaySeller={mediator.payBob}
            onRefundBuyer={mediator.refundAlice}
          />

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
            <TransactionFeed events={events} filterParty="carol" emptyText="no activity yet" />
          </div>
        </div>
      </div>
    </div>
  );
}
