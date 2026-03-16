import { useState } from "react";
import { useEscrowStore, generateDealId, saveCurrentEscrows, useHeadProposalStore } from "../escrow-store";
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
  const { addEscrow, updateEscrow, escrows } = useEscrowStore();
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
      const newEscrow = {
        dealId: newDealId,
        status: "PENDING" as const,
        amount: String(lovelace),
        description,
        recipientAddress: recipient,
        txHash: hash,
        disputeReason: "",
      };
      addEscrow(newEscrow);
      // Save all escrows to head-based storage
      saveCurrentEscrows(currentHeadId, [...escrows, { ...newEscrow, createdAt: Date.now() }]);
      logEscrowLock("alice", recipient, lovelace, description, hash);
      toast(`Escrow ${newDealId} created! All parties in head can see it.`, true);
    } catch (err: any) {
      toast(err?.message ?? "Lock failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: release to recipient (by dealId) ───────────────────────────────
  async function releasePayment(dealId: string) {
    setLoading(true);
    try {
      const escrow = escrows.find(e => e.dealId === dealId);
      if (!escrow) {
        toast("Escrow not found", false);
        return;
      }
      const lovelace = Number(escrow.amount);
      const hash = await apiSend("alice", escrow.recipientAddress, lovelace);
      updateEscrow(dealId, { status: "COMPLETED", txHash: hash });
      saveCurrentEscrows(currentHeadId, escrows.map(e => 
        e.dealId === dealId ? { ...e, status: "COMPLETED" as const, txHash: hash } : e
      ));
      logEscrowRelease("alice", escrow.recipientAddress, lovelace, hash);
      toast("Payment released!", true);
    } catch (err: any) {
      toast(err?.message ?? "Release failed", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: raise dispute ──────────────────────────────────────────────────
  async function raiseDispute(dealId: string, reason: string) {
    setLoading(true);
    try {
      const escrow = escrows.find(e => e.dealId === dealId);
      if (!escrow) {
        toast("Escrow not found", false);
        setLoading(false);
        return;
      }

      const lovelace = Number(escrow.amount);
      
      // Send escrow amount to mediator (Carol)
      const hash = await apiSend("alice", PARTY_ADDRESSES.carol, lovelace);
      
      // Update escrow status to DISPUTED
      updateEscrow(dealId, { status: "DISPUTED", disputeReason: reason, txHash: hash });
      saveCurrentEscrows(currentHeadId, escrows.map(e =>
        e.dealId === dealId 
          ? { ...e, status: "DISPUTED" as const, disputeReason: reason, txHash: hash } 
          : e
      ));
      
      logEscrowDispute("alice", lovelace, reason);
      toast(`Dispute raised. ${(lovelace / 1_000_000).toFixed(2)} ADA sent to mediator.`, false);
    } catch (err: any) {
      toast(err?.message ?? "Failed to raise dispute", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Escrow: cancel/remove ──────────────────────────────────────────────────
  function cancelEscrow(dealId: string) {
    const { removeEscrow } = useEscrowStore.getState();
    removeEscrow(dealId);
    saveCurrentEscrows(currentHeadId, escrows.filter(e => e.dealId !== dealId));
    toast("Escrow cancelled", true);
  }

  // ── Backward compatibility: reset (removes first pending) ──────────────────
  function resetEscrowState() {
    const pending = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    if (pending) {
      cancelEscrow(pending.dealId);
    }
  }

  return { loading, directSend, lockFunds, releasePayment, raiseDispute, cancelEscrow, resetEscrowState };
}
