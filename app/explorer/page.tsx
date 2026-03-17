"use client";

import { useTxLogStore } from "@/lib/tx-log-store";
import { useEscrowStore } from "@/lib/escrow-store";
import Link from "next/link";
import type { TxEvent } from "@/lib/types";

const KIND_COLOR: Record<string, string> = {
  direct_send:           "text-blue-400",
  escrow_lock:           "text-amber-400 border-amber-800",
  escrow_release:        "text-green-400 border-green-800",
  escrow_dispute:        "text-orange-400 border-orange-800",
  escrow_resolve_pay:    "text-green-400 border-green-800",
  escrow_resolve_refund: "text-blue-400 border-blue-800",
};

const STATUS_LABEL: Record<string, string> = {
  escrow_lock: "Payment Protected",
  escrow_release: "Payment Released",
  escrow_dispute: "Issue Reported",
  escrow_resolve_pay: "Payment Sent",
  escrow_resolve_refund: "Refund Sent",
  direct_send: "Direct Payment",
};

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default function ExplorerPage() {
  const events = useTxLogStore((s) => s.events);
  const { status: escrowStatus, amount: escrowAmount } = useEscrowStore();

  // Filter out head events, only show actual transactions
  const txEvents = events.filter((e) => 
    !["head_open", "head_close", "head_fanout"].includes(e.kind)
  );

  // Calculate stats
  const protectedAmount = txEvents
    .filter((e) => e.kind === "escrow_lock")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const activeOrders = txEvents.filter((e) => 
    e.kind === "escrow_lock" && escrowStatus === "PENDING"
  ).length;

  const flaggedForReview = txEvents.filter((e) => 
    e.kind === "escrow_dispute"
  ).length;

  const releasedValue = txEvents
    .filter((e) => ["escrow_release", "escrow_resolve_pay"].includes(e.kind))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto py-10 px-6">

        {/* Header */}
        <div className="mb-8 border-b border-zinc-800 pb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-mono font-bold text-zinc-100">All Transactions</h1>
              <span className="text-xs font-mono text-zinc-600 border border-zinc-700 rounded px-2 py-1 uppercase tracking-wider">
                Live Feed
              </span>
            </div>
            <p className="text-sm font-mono text-zinc-500">
              // All payments are automatically protected until delivery is confirmed
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            &lt; home
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="total_protected_ada"
            value={`${(protectedAmount / 1_000_000).toFixed(0)} ₳`}
            color="border-zinc-800"
          />
          <StatCard
            label="active_orders"
            value={activeOrders.toString()}
            color="border-zinc-800"
          />
          <StatCard
            label="flagged_for_review"
            value={flaggedForReview.toString()}
            color="border-amber-800"
          />
          <StatCard
            label="released_value"
            value={`${(releasedValue / 1_000_000).toFixed(0)} ₳`}
            color="border-green-800"
          />
        </div>

        {/* Network Activity Table */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest">
              Transaction List
            </h2>
            <p className="text-xs font-mono text-zinc-700">
              synced slot: #{Math.floor(Date.now() / 1000)}
            </p>
          </div>

          {txEvents.length === 0 ? (
            <p className="text-xs font-mono text-zinc-600 py-8 text-center">
              // no transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">
                      Parties
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">
                      Protection Status
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {txEvents.slice(0, 20).map((event) => (
                    <ActivityRow key={event.id} event={event} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`border ${color} rounded bg-zinc-900 p-4`}>
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="text-2xl font-mono font-bold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function ActivityRow({ event }: { event: TxEvent }) {
  const orderId = event.txHash?.slice(0, 8).toUpperCase() || event.id.slice(-6).toUpperCase();
  const statusLabel = STATUS_LABEL[event.kind] || event.kind;
  const statusColor = KIND_COLOR[event.kind] || "text-zinc-500";

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
      <td className="py-3 px-2">
        <code className="text-xs font-mono text-blue-400">
          ORD-{orderId}
        </code>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span>
            {event.party === "alice" ? "B:" : event.party === "bob" ? "S:" : "M:"}
          </span>
          <span className="text-zinc-600">
            {event.toAddress?.slice(0, 8) || "addr1..."}
          </span>
        </div>
      </td>
      <td className="py-3 px-2">
        <span className={`text-xs font-mono px-2 py-1 rounded border ${statusColor.split(" ")[1] || "border-zinc-700"}`}>
          {statusLabel}
        </span>
      </td>
      <td className="py-3 px-2 text-right">
        {event.amount ? (
          <span className="text-sm font-mono text-zinc-300">
            {(event.amount / 1_000_000).toFixed(2)} ₳
          </span>
        ) : (
          <span className="text-xs font-mono text-zinc-700">—</span>
        )}
      </td>
      <td className="py-3 px-2 text-right">
        <span className="text-xs font-mono text-zinc-600">
          {formatTime(event.timestamp)}
        </span>
      </td>
    </tr>
  );
}
