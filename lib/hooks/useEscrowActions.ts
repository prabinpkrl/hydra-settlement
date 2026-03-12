import { useState } from "react";
import { useEscrowStore, generateDealId, saveCurrentEscrow, useHeadProposalStore } from "../escrow-store";
import {
  logDirectSend,
  logEscrowLock,
  logEscrowRelease,
  logEscrowDispute,
} from "../tx-log-store";
import { PARTY_ADDRESSES } from "../types";

/** Raw API call — send ADA from a named party to an address. */
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

/**
 * All escrow + direct-transfer actions for Alice (Buyer).
 * Returns handlers; UI components call them and read `loading`.
 */
export function useEscrowActions(toast: (msg: string, ok: boolean) => void) {
  const [loading, setLoading] = useState(false);
  const {
    status, amount, recipientAddress, dealId,
    setEscrow, resetEscrow,
  } = useEscrowStore();
  const { currentHeadId } = useHeadProposalStore();

  // ── Direct transfer ────────────────────────────────────────────────────────
  async function directSend(toAddress: string, lovelaceAmount: number) {
    setLoading(true);
    try {
      const hash = await apiSend("alice", toAddress, lovelaceAmount);
      logDirectSend("alice", toAddress, lovelaceAmount, hash);
      toast("Transfer sent!", true);
      return hash;
    } catch (err: any) {
      toast(err?.message ?? "Transfer failed", false);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: lock funds (self-send to hold at Alice's address) ──────────────
  async function lockFunds(
    recipient: string,
    lovelace: number,
    description: string
  ) {
    setLoading(true);
    try {
      const hash = await apiSend("alice", PARTY_ADDRESSES.alice, lovelace);
      const newDealId = generateDealId();
      const escrowData = {
        status: "PENDING" as const,
        dealId: newDealId,
        amount: String(lovelace),
        description,
        recipientAddress: recipient,
        txHash: hash
      };
      setEscrow(escrowData);
      // Save to head-based storage instead of deal-based
      saveCurrentEscrow(currentHeadId, escrowData);
      logEscrowLock("alice", recipient, lovelace, description, hash);
      toast(`Escrow created! All parties in head can see it.`, true);
    } catch (err: any) {
      toast(err?.message ?? "Lock failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: release to recipient ───────────────────────────────────────────
  async function releasePayment() {
    setLoading(true);
    try {
      const lovelace = Number(amount);
      const hash = await apiSend("alice", recipientAddress, lovelace);
      const updated = { status: "COMPLETED" as const, txHash: hash };
      setEscrow(updated);
      saveCurrentEscrow(currentHeadId, { ...useEscrowStore.getState(), ...updated });
      logEscrowRelease("alice", recipientAddress, lovelace, hash);
      toast("Payment released!", true);
    } catch (err: any) {
      toast(err?.message ?? "Release failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: raise dispute ──────────────────────────────────────────────────
  function raiseDispute(reason: string) {
    const updated = { status: "DISPUTED" as const, disputeReason: reason };
    setEscrow(updated);
    saveCurrentEscrow(currentHeadId, { ...useEscrowStore.getState(), ...updated });
    logEscrowDispute("alice", Number(amount), reason);
    toast("Dispute raised. Mediator notified.", false);
  }

  // ── Escrow: reset ──────────────────────────────────────────────────────────
  function resetEscrowState() {
    resetEscrow();
  }

  return { loading, directSend, lockFunds, releasePayment, raiseDispute, resetEscrowState };
}
