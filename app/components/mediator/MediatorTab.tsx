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
import { PARTY_ADDRESSES } from "@/lib/types";

const DISPUTE_AMOUNT_ADA = "5";

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
  const { syncFromHead } = useEscrowStore();

  const { status: escrowStatus, amount } = useEscrowStore();

  const isOpen     = headTag === "Open";
  const isDisputed = escrowStatus === "DISPUTED";
  const canAct     = isOpen && isDisputed && mediator.resolution === "";
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

      <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

      {/* Dispute resolution panel */}
      {isDisputed ? (
        <section className="border border-orange-900 rounded bg-zinc-900 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">dispute_resolution</p>
            <span className="text-xs font-mono text-orange-400 border border-orange-800 rounded px-2 py-0.5">PENDING</span>
          </div>

          <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-4 flex flex-col gap-1.5 text-xs font-mono">
            <div className="flex gap-2">
              <span className="text-zinc-600 flex-shrink-0">amount:</span>
              <span className="text-zinc-400">
                {amount ? `${(Number(amount) / 1_000_000).toFixed(2)} ADA` : `${DISPUTE_AMOUNT_ADA} ADA`}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-zinc-600 flex-shrink-0">buyer_alice:</span>
              <span className="text-zinc-400">{PARTY_ADDRESSES.alice.slice(0, 14)}...{PARTY_ADDRESSES.alice.slice(-6)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-zinc-600 flex-shrink-0">seller_bob:</span>
              <span className="text-zinc-400">{PARTY_ADDRESSES.bob.slice(0, 14)}...{PARTY_ADDRESSES.bob.slice(-6)}</span>
            </div>
          </div>

          {mediator.resolution === "" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={mediator.payBob}
                disabled={!canAct || mediator.loading}
                className="w-full border border-green-800 text-green-300 rounded px-3 py-2 text-xs font-mono text-left
                  hover:bg-green-950 transition-colors flex items-center gap-2
                  disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent"
              >
                {mediator.loading ? <Spinner text="sending..." /> : "> pay bob (seller)"}
              </button>

              <button
                onClick={mediator.refundAlice}
                disabled={!canAct || mediator.loading}
                className="w-full border border-blue-800 text-blue-300 rounded px-3 py-2 text-xs font-mono text-left
                  hover:bg-blue-950 transition-colors flex items-center gap-2
                  disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent"
              >
                {mediator.loading ? <Spinner text="sending..." /> : "> refund alice (buyer)"}
              </button>

              {!isOpen && (
                <p className="text-xs font-mono text-zinc-700">// head not open</p>
              )}
            </div>
          )}

          {mediator.resolution === "paid" && (
            <div className="border border-green-900 rounded bg-zinc-950 p-3">
              <p className="text-xs font-mono text-green-400 mb-1">// resolved — payment sent to bob</p>
              <p className="font-mono text-xs text-zinc-600 break-all">{mediator.resolveTxHash}</p>
            </div>
          )}

          {mediator.resolution === "refunded" && (
            <div className="border border-blue-900 rounded bg-zinc-950 p-3">
              <p className="text-xs font-mono text-blue-400 mb-1">// resolved — refund sent to alice</p>
              <p className="font-mono text-xs text-zinc-600 break-all">{mediator.resolveTxHash}</p>
            </div>
          )}
        </section>
      ) : null}

      {/* Activity feed */}
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">activity_log</p>
        <TransactionFeed events={events} filterParty="carol" emptyText="no activity yet" />
      </div>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <>
      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      {text}
    </>
  );
}
