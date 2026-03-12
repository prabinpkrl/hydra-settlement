import { create } from "zustand";
import type { TxEvent, TxEventKind, Party } from "./types";

let _counter = 0;
function makeId() {
  return `${Date.now()}-${++_counter}`;
}

type TxLogStore = {
  events: TxEvent[];
  addEvent: (e: Omit<TxEvent, "id" | "timestamp">) => void;
  clear: () => void;
};

export const useTxLogStore = create<TxLogStore>((set) => ({
  events: [],

  addEvent: (e) =>
    set((state) => ({
      events: [
        { ...e, id: makeId(), timestamp: Date.now() },
        ...state.events,
      ],
    })),

  clear: () => set({ events: [] }),
}));

// ── Convenience helpers ───────────────────────────────────────────────────────
export function logDirectSend(
  party: Party,
  toAddress: string,
  amount: number,
  txHash: string
) {
  useTxLogStore.getState().addEvent({ kind: "direct_send", party, toAddress, amount, txHash });
}

export function logEscrowLock(
  party: Party,
  toAddress: string,
  amount: number,
  description: string,
  txHash: string
) {
  useTxLogStore.getState().addEvent({ kind: "escrow_lock", party, toAddress, amount, description, txHash });
}

export function logEscrowRelease(party: Party, toAddress: string, amount: number, txHash: string) {
  useTxLogStore.getState().addEvent({ kind: "escrow_release", party, toAddress, amount, txHash });
}

export function logEscrowDispute(party: Party, amount: number, disputeReason: string) {
  useTxLogStore.getState().addEvent({ kind: "escrow_dispute", party, amount, disputeReason });
}

export function logEscrowResolvePay(party: Party, toAddress: string, amount: number, txHash: string) {
  useTxLogStore.getState().addEvent({ kind: "escrow_resolve_pay", party, toAddress, amount, txHash, resolvedFor: "bob" });
}

export function logEscrowResolveRefund(party: Party, toAddress: string, amount: number, txHash: string) {
  useTxLogStore.getState().addEvent({ kind: "escrow_resolve_refund", party, toAddress, amount, txHash, resolvedFor: "alice" });
}

export function logHeadEvent(kind: "head_open" | "head_close" | "head_fanout", party: Party) {
  useTxLogStore.getState().addEvent({ kind, party });
}
