import { useState } from "react";
import { useEscrowStore } from "../escrow-store";
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
  const [loading,    setLoading]    = useState(false);
  const [resolution, setResolution] = useState<"" | "paid" | "refunded">("");
  const [resolveTxHash, setResolveTxHash] = useState("");

  const { amount, recipientAddress, setEscrow } = useEscrowStore();

  async function payBob() {
    setLoading(true);
    try {
      const lovelace  = Number(amount) || FALLBACK_LOVELACE;
      const recipient = recipientAddress || PARTY_ADDRESSES.bob;
      const hash = await apiSend("carol", recipient, lovelace);
      setResolveTxHash(hash);
      setResolution("paid");
      setEscrow({ status: "COMPLETED", txHash: hash });
      logEscrowResolvePay("carol", recipient, lovelace, hash);
      toast("Payment sent to Bob!", true);
    } catch (err: any) {
      toast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  async function refundAlice() {
    setLoading(true);
    try {
      const lovelace = Number(amount) || FALLBACK_LOVELACE;
      const hash = await apiSend("carol", PARTY_ADDRESSES.alice, lovelace);
      setResolveTxHash(hash);
      setResolution("refunded");
      setEscrow({ status: "COMPLETED", txHash: hash });
      logEscrowResolveRefund("carol", PARTY_ADDRESSES.alice, lovelace, hash);
      toast("Refund sent to Alice!", true);
    } catch (err: any) {
      toast(err?.message ?? "Transaction failed", false);
    } finally {
      setLoading(false);
    }
  }

  return { loading, resolution, resolveTxHash, payBob, refundAlice };
}
