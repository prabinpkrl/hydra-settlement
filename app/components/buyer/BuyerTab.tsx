"use client";

import { useState } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useHeadActions } from "@/lib/hooks/useHeadActions";
import { useEscrowActions } from "@/lib/hooks/useEscrowActions";
import { useEscrowStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { Toast } from "@/app/components/ui/Toast";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
import { HeadControls } from "@/app/components/buyer/HeadControls";
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

  const {
    status: escrowStatus,
    amount, description, recipientAddress, disputeReason, txHash,
  } = useEscrowStore();

  const isOpen = headTag === "Open";

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Identity header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 font-mono break-all">
            addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4
          </p>
        </div>
        <HeadStatusBadge tag={headTag} />
      </div>

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

      <BalanceCard
        balance={balance}
        utxos={utxos}
        loading={utxoLoading}
        isOpen={isOpen}
      />

      {/* Transfer mode tabs */}
      <div className="flex gap-2 mb-5">
        {(["direct", "escrow"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
              mode === m
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {m === "direct" ? "Direct Transfer" : "Escrow Transfer"}
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
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">My Activity</h2>
        <TransactionFeed
          events={events}
          filterParty="alice"
          emptyText="No transactions yet."
        />
      </div>
    </div>
  );
}
