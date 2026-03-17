import { useState } from "react";
import { useL2CounterStore } from "../escrow-store";
import { logDirectSend, logEscrowRelease } from "../tx-log-store";
import type { Party } from "../types";
import { PARTY_ADDRESSES } from "../types";

/** Raw API call — send ADA from a named party to an address. */
async function apiSend(from: string, toAddress: string, lovelace: number): Promise<string> {
  const res = await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, toAddress, lovelace }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Send failed");
  return data.hash as string;
}

/**
 * Generic party actions - works for any party (alice, bob, carol)
 * Allows sending transactions and logging them to tx-log-store
 */
export function usePartyActions(party: Party, toast: (msg: string, ok: boolean) => void) {
  const [loading, setLoading] = useState(false);
  const { incrementL2Tx } = useL2CounterStore();

  // ── Direct transfer ────────────────────────────────────────────────────────
  async function directSend(toAddress: string, lovelaceAmount: number) {
    setLoading(true);
    try {
      const hash = await apiSend(party, toAddress, lovelaceAmount);
      logDirectSend(party, toAddress, lovelaceAmount, hash);
      toast("Transfer sent!", true);
      return hash;
    } catch (err: any) {
      const message = err?.message ?? "Transfer failed";
      console.error(`[usePartyActions.directSend] Error for ${party}:`, message);
      toast(message, false);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ── Quick payment release (simplified payment send) ────────────────────────
  async function sendPayment(toAddress: string, lovelaceAmount: number, description?: string) {
    setLoading(true);
    try {
      const hash = await apiSend(party, toAddress, lovelaceAmount);
      logEscrowRelease(party, toAddress, lovelaceAmount, hash);
      toast(`Payment sent: ${(lovelaceAmount / 1_000_000).toFixed(2)} ADA`, true);
      return hash;
    } catch (err: any) {
      const message = err?.message ?? "Payment send failed";
      console.error(`[usePartyActions.sendPayment] Error for ${party}:`, message);
      toast(message, false);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, directSend, sendPayment };
}
