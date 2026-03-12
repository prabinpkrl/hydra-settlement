"use client";

import { useState } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useMediatorActions } from "@/lib/hooks/useMediatorActions";
import { useEscrowStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import { BalanceCard } from "@/app/components/ui/BalanceCard";
import { Toast } from "@/app/components/ui/Toast";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";
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

  const { status: escrowStatus, amount } = useEscrowStore();

  const isOpen     = headTag === "Open";
  const isDisputed = escrowStatus === "DISPUTED";
  const canAct     = isOpen && isDisputed && mediator.resolution === "";

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Identity */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-gray-400 font-mono break-all">
          {PARTY_ADDRESSES.carol}
        </p>
        <HeadStatusBadge tag={headTag} />
      </div>

      <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

      {/* Dispute resolution panel */}
      {isDisputed ? (
        <section className="bg-white border border-orange-200 rounded-lg p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-orange-900">Dispute Active</h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200">
              Pending
            </span>
          </div>

          <div className="bg-orange-50 rounded-md p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-gray-900">
                {amount ? `${(Number(amount) / 1_000_000).toFixed(2)} ADA` : `${DISPUTE_AMOUNT_ADA} ADA`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Buyer (Alice)</span>
              <span className="font-mono text-xs text-gray-500">
                {PARTY_ADDRESSES.alice.slice(0, 12)}…{PARTY_ADDRESSES.alice.slice(-6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seller (Bob)</span>
              <span className="font-mono text-xs text-gray-500">
                {PARTY_ADDRESSES.bob.slice(0, 12)}…{PARTY_ADDRESSES.bob.slice(-6)}
              </span>
            </div>
          </div>

          {mediator.resolution === "" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={mediator.payBob}
                disabled={!canAct || mediator.loading}
                className="w-full bg-green-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {mediator.loading ? <Spinner /> : "Pay Bob (Seller)"}
              </button>

              <button
                onClick={mediator.refundAlice}
                disabled={!canAct || mediator.loading}
                className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {mediator.loading ? <Spinner /> : "Refund Alice (Buyer)"}
              </button>

              {!isOpen && (
                <p className="text-xs text-gray-400 text-center">Head must be Open to resolve.</p>
              )}
            </div>
          )}

          {mediator.resolution === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">Resolved — Payment sent to Bob</p>
              <p className="font-mono text-xs text-gray-600 break-all">{mediator.resolveTxHash}</p>
            </div>
          )}

          {mediator.resolution === "refunded" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Resolved — Refund sent to Alice</p>
              <p className="font-mono text-xs text-gray-600 break-all">{mediator.resolveTxHash}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white border border-gray-200 rounded-lg p-5 text-center mb-5">
          <p className="text-sm text-gray-400">
            No active dispute. Resolution panel appears when a dispute is raised.
          </p>
        </section>
      )}

      {/* Activity feed */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">My Activity</h2>
        <TransactionFeed
          events={events}
          filterParty="carol"
          emptyText="No activity yet."
        />
      </div>
    </div>
  );
}

function Spinner() {
  return <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>;
}
