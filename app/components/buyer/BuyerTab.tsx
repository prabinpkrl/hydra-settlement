"use client";

import { useState } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useHeadActions } from "@/lib/hooks/useHeadActions";
import { useEscrowActions } from "@/lib/hooks/useEscrowActions";
import { useEscrowStore, useHeadProposalStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { Toast } from "@/app/components/ui/Toast";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { HeadControls } from "@/app/components/buyer/HeadControls";
import { HeadProposal } from "@/app/components/shared/HeadProposal";
import { DirectTransferForm } from "@/app/components/buyer/DirectTransferForm";
import { EscrowForm } from "@/app/components/buyer/EscrowForm";
import { EscrowActive } from "@/app/components/buyer/EscrowActive";
import { EscrowDisputed } from "@/app/components/buyer/EscrowDisputed";
import { EscrowCompleted } from "@/app/components/buyer/EscrowCompleted";

type Mode = "direct" | "escrow";

export function BuyerTab() {
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [mode,    setMode]    = useState<Mode>("direct");

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const headTag  = useHeadState("alice");
  const { utxos, balance, loading: utxoLoading } = usePartyUtxos("alice");
  const headActions   = useHeadActions(undefined, showToast);
  const escrowActions = useEscrowActions(showToast);
  const events        = useTxLogStore((s) => s.events);
  const { proposal, markActive } = useHeadProposalStore();

  const {
    status: escrowStatus,
    dealId, amount, description, recipientAddress, disputeReason, txHash,
  } = useEscrowStore();

  const isOpen = headTag === "Open";
  const headNotInitialized = headTag === "Idle" || headTag === "...";

  // Handle head initialization when all parties joined
  const handleHeadReady = async () => {
    markActive();
    await headActions.initHead();
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Identity header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">alice :: buyer</p>
          <p className="text-xs font-mono text-zinc-700 break-all">
            addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4
          </p>
        </div>
        <div className="flex-shrink-0">
          <HeadStatusBadge tag={headTag} />
        </div>
      </div>

      {/* Head Coordination or Controls */}
      {headNotInitialized && proposal?.status !== "active" ? (
        <HeadProposal party="alice" onHeadReady={handleHeadReady} />
      ) : (
        <HeadControls
          headTag={headTag}
          loading={headActions.loading}
          closing={headActions.closing}
          fanouting={headActions.fanouting}
          commitStates={headActions.commitStates}
          statusMsg={headActions.statusMsg}
          onInit={headActions.initHead}
          onCommitAll={headActions.commitAll}
          onClose={headActions.closeHead}
          onFanout={headActions.fanoutHead}
        />
      )}

      <BalanceCard
        balance={balance}
        utxos={utxos}
        loading={utxoLoading}
        isOpen={isOpen}
      />

      {/* Transfer mode tabs */}
      <div className="flex gap-1 mb-4 border border-zinc-800 rounded p-1 bg-zinc-900">
        {(["direct", "escrow"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded text-xs font-mono uppercase tracking-widest transition-colors ${
              mode === m
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {m === "direct" ? "direct" : "escrow"}
          </button>
        ))}
      </div>

      {mode === "direct" && (
        <DirectTransferForm
          isOpen={isOpen}
          loading={escrowActions.loading}
          onSend={escrowActions.directSend}
        />
      )}

      {mode === "escrow" && (
        <>
          {escrowStatus === "IDLE" && (
            <EscrowForm
              isOpen={isOpen}
              loading={escrowActions.loading}
              onLock={escrowActions.lockFunds}
            />
          )}
          {escrowStatus === "PENDING" && (
            <EscrowActive
              isOpen={isOpen}
              loading={escrowActions.loading}
              dealId={dealId}
              amount={amount}
              description={description}
              recipient={recipientAddress}
              txHash={txHash}
              onRelease={escrowActions.releasePayment}
              onCancel={escrowActions.resetEscrowState}
              onDispute={escrowActions.raiseDispute}
            />
          )}
          {escrowStatus === "DISPUTED" && (
            <EscrowDisputed
              dealId={dealId}
              amount={amount}
              recipient={recipientAddress}
              description={description}
              disputeReason={disputeReason}
            />
          )}
          {escrowStatus === "COMPLETED" && (
            <EscrowCompleted
              amount={amount}
              recipient={recipientAddress}
              description={description}
              txHash={txHash}
              onReset={escrowActions.resetEscrowState}
            />
          )}
        </>
      )}

      {/* Activity feed */}
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">activity_log</p>
        <TransactionFeed
          events={events}
          filterParty="alice"
          emptyText="no transactions yet"
        />
      </div>
    </div>
  );
}
