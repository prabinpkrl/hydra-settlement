"use client";

import { useState, useEffect } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { usePartyActions } from "@/lib/hooks/usePartyActions";
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
import {
  validateAmount,
  validateAddress,
  hasErrors,
  type ValidationError,
} from "@/lib/validation";

export function MediatorTab() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState({ recipient: false, amount: false });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const headTag = useHeadState("carol");
  const { utxos, balance, loading } = usePartyUtxos("carol");
  const partyActions = usePartyActions("carol", showToast);
  const events = useTxLogStore((s) => s.events);
  const mediator = useMediatorActions(showToast);
  const { proposal, currentHeadId } = useHeadProposalStore();
  const { escrows, syncFromHead, setCurrentHeadId } = useEscrowStore();

  const isOpen = headTag === "Open";
  const headNotInitialized = headTag === "Idle" || headTag === "...";

  // Sync current headId so escrows auto-save to localStorage
  useEffect(() => {
    if (proposal?.headId) {
      setCurrentHeadId(proposal.headId);
    }
  }, [proposal?.headId, setCurrentHeadId]);

  // Auto-sync escrow from head storage when head is active
  useEffect(() => {
    if (currentHeadId && proposal?.status === "active") {
      const interval = setInterval(() => {
        syncFromHead(currentHeadId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentHeadId, proposal?.status, syncFromHead]);

  // Validation
  const errors = {
    recipient: touched.recipient ? validateAddress(recipient) : null,
    amount: touched.amount ? validateAmount(amount, balance) : null,
  };

  const disabled =
    !isOpen ||
    !recipient ||
    !amount ||
    partyActions.loading ||
    hasErrors(errors);

  async function handleSend() {
    setTouched({ recipient: true, amount: true });

    if (validateAddress(recipient) || validateAmount(amount, balance)) {
      return;
    }

    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (lovelace <= 0) return;

    const hash = await partyActions.directSend(recipient, lovelace);
    if (hash) {
      setRecipient("");
      setAmount("");
      setTouched({ recipient: false, amount: false });
    }
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Identity */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">Dispute Resolver</p>
          <p className="text-xs font-mono text-zinc-700 break-all">{PARTY_ADDRESSES.carol}</p>
        </div>
        <div className="flex-shrink-0">
          <HeadStatusBadge tag={headTag} />
        </div>
      </div>

      {/* L2 Banner - Show when head is open */}
      {isOpen && (
        <div className="rounded-xl p-3 mb-4 bg-green-900 border border-green-500 flex items-center gap-2">
          <span className="text-green-300 font-semibold">⚡ You are on Layer 2 — transactions are instant and completely free</span>
        </div>
      )}

      {/* Head Coordination */}
      {headNotInitialized && proposal?.status !== "active" && (
        <HeadProposal party="carol" />
      )}

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Balance and dispute resolution */}
        <div className="space-y-4">
          <BalanceCard balance={balance} utxos={utxos} loading={loading} isOpen={isOpen} />

          {/* Direct send form */}
          {isOpen && (
            <section className="border border-zinc-800 rounded bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Send Payment</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-mono text-zinc-600 mb-1 block">To Address:</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setTouched({ ...touched, recipient: true });
                    }}
                    placeholder="addr_test1..."
                    disabled={!isOpen || partyActions.loading}
                    className={`w-full bg-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono
                      placeholder:text-zinc-700 focus:outline-none
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${
                        errors.recipient
                          ? "border-2 border-red-700 focus:border-red-600"
                          : "border border-zinc-700 focus:border-zinc-500"
                      }`}
                  />
                  {errors.recipient && (
                    <p className="text-xs font-mono text-red-400 mt-1">// {errors.recipient}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-600 mb-1 block">Amount:</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setTouched({ ...touched, amount: true });
                    }}
                    placeholder="0.00"
                    disabled={!isOpen || partyActions.loading}
                    className={`w-full bg-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono
                      placeholder:text-zinc-700 focus:outline-none
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${
                        errors.amount
                          ? "border-2 border-red-700 focus:border-red-600"
                          : "border border-zinc-700 focus:border-zinc-500"
                      }`}
                  />
                  {errors.amount && (
                    <p className="text-xs font-mono text-red-400 mt-1">// {errors.amount}</p>
                  )}
                </div>

                <button
                  onClick={handleSend}
                  disabled={disabled}
                  className={`w-full border rounded px-3 py-2 text-xs font-mono text-left transition-colors
                    border-blue-800 text-blue-300 hover:bg-blue-950
                    disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent`}
                >
                  {partyActions.loading ? (
                    <>
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "> Send Payment"
                  )}
                </button>
              </div>
            </section>
          )}

          <DisputeList
            escrows={escrows}
            isOpen={isOpen}
            loading={mediator.loading}
            onPaySeller={mediator.payBob}
            onRefundBuyer={mediator.refundAlice}
          />

          {!isOpen && !loading && (
            <section className="border border-zinc-800 rounded bg-zinc-900 p-4">
              <p className="text-xs font-mono text-zinc-700">// waiting for payment room to open</p>
            </section>
          )}
        </div>

        {/* Right column - Activity feed */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Activity</p>
            <TransactionFeed events={events} filterParty="carol" emptyText="no activity yet" isL2={isOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}
