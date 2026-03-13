import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TxEvent, TxEventKind, Party } from "./types";

let _counter = 0;
function makeId() {
  return `${Date.now()}-${++_counter}`;
}

// ── BroadcastChannel for cross-tab communication ───────────────────────────
let txLogChannel: BroadcastChannel | null = null;

function getTxLogChannel() {
  if (typeof window !== "undefined" && !txLogChannel) {
    try {
      txLogChannel = new BroadcastChannel("tx-log-store");
    } catch (e) {
      // BroadcastChannel not supported
    }
  }
  return txLogChannel;
}

type TxLogStore = {
  events: TxEvent[];
  addEvent: (e: Omit<TxEvent, "id" | "timestamp">) => void;
  clear: () => void;
};

export const useTxLogStore = create<TxLogStore>(
  persist(
    (set) => ({
      events: [],

      addEvent: (e) =>
        set((state) => {
          const newEvent = { ...e, id: makeId(), timestamp: Date.now() };
          const newState = {
            events: [newEvent, ...state.events],
          };
          // Broadcast to other tabs
          const channel = getTxLogChannel();
          if (channel) {
            try {
              channel.postMessage({ type: "update", events: newState.events });
            } catch (err) {
              console.error("Failed to broadcast tx-log update:", err);
            }
          }
          return newState;
        }),

      clear: () => set({ events: [] }),
    }),
    {
      name: "tx-log-store",
      version: 1,
    }
  )
);

// ── Listen for broadcasts from other tabs ──────────────────────────────────
if (typeof window !== "undefined") {
  const channel = getTxLogChannel();
  if (channel) {
    channel.onmessage = (e) => {
      if (e.data?.type === "update" && e.data?.events) {
        useTxLogStore.setState({ events: e.data.events });
      }
    };
  }
}

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
