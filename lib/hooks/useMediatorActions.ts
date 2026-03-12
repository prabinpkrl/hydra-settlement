import { useState } from "react";
import { useEscrowStore, saveCurrentEscrows, useHeadProposalStore } from "../escrow-store";
import { logEscrowResolvePay, logEscrowResolveRefund } from "../tx-log-store";
import { PARTY_ADDRESSES } from "../types";

async function apiSend(from: string, toAddress: string, lovelace: number): Promise<string> {
  const res = await fetch("/api/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ from, toAddress, lovelace }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Send failed");
  return data.hash as string;
}

const FALLBACK_LOVELACE = 5_000_000;

export function useMediatorActions(toast: (msg: string, ok: boolean) => void) {
  const [loading, setLoading] = useState(false);

  const { escrows, updateEscrow } = useEscrowStore();
  const { currentHeadId } = useHeadProposalStore();

  async function payBob(dealId: string, bobAddress: string, amountStr: string) {
    setLoading(true);
    try {
      const lovelace = Number(amountStr) || FALLBACK_LOVELACE;
      const hash = await apiSend("carol", bobAddress, lovelace);
      updateEscrow(dealId, { status: "COMPLETED", txHash: hash });
      saveCurrentEscrows(currentHeadId, escrows.map(e =>
        e.dealId === dealId ? { ...e, status: "COMPLETED" as const, txHash: hash } : e
      ));
      logEscrowResolvePay("carol", bobAddress, lovelace, hash);
      toast("Payment sent to Bob!", true);
    } catch (err: any) {
      toast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  async function refundAlice(dealId: string, amountStr: string) {
    setLoading(true);
    try {
      const lovelace = Number(amountStr) || FALLBACK_LOVELACE;
      const hash = await apiSend("carol", PARTY_ADDRESSES.alice, lovelace);
      updateEscrow(dealId, { status: "COMPLETED", txHash: hash });
      saveCurrentEscrows(currentHeadId, escrows.map(e =>
        e.dealId === dealId ? { ...e, status: "COMPLETED" as const, txHash: hash } : e
      ));
      logEscrowResolveRefund("carol", PARTY_ADDRESSES.alice, lovelace, hash);
      toast("Refund sent to Alice!", true);
    } catch (err: any) {
      toast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  return { loading, payBob, refundAlice };
}
