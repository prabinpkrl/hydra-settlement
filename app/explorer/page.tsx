"use client";

import { useTxLogStore } from "@/lib/tx-log-store";
import { useEscrowStore } from "@/lib/escrow-store";
import Link from "next/link";
import { Navbar } from "@/app/components/shared/Navbar";
import type { TxEvent } from "@/lib/types";

const KIND_COLOR: Record<string, string> = {
  // direct_send:           "text-blue-400",
  escrow_lock:           "text-slate-600 bg-slate-50 border-slate-100",
  escrow_release:        "text-green-600 bg-green-50 border-green-100",
  escrow_dispute:        "text-yellow-600 bg-yellow-50 border-yellow-100",
  escrow_resolve_pay:    "text-green-600 bg-green-50 border-green-100",
  escrow_resolve_refund: "text-blue-600 bg-blue-50 border-blue-100",
};

const STATUS_LABEL: Record<string, string> = {
  escrow_lock: "Payment Protected",
  escrow_release: "Payment Released",
  escrow_dispute: "Issue Reported",
  escrow_resolve_pay: "Payment Sent",
  escrow_resolve_refund: "Refund Sent",
  // direct_send: "Direct Payment",
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
    <main className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Transaction Explorer</h1>
            <p className="text-sm text-[#64748b]">
              All payments are automatically protected until delivery is confirmed
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Protected Amount"
            value={`${(protectedAmount / 1_000_000).toFixed(0)} ₳`}
          />
          <StatCard
            label="Active Orders"
            value={activeOrders.toString()}
          />
          <StatCard
            label="Issues Reported"
            value={flaggedForReview.toString()}
          />
          <StatCard
            label="Released Value"
            value={`${(releasedValue / 1_000_000).toFixed(0)} ₳`}
          />
        </div>

        {/* Network Activity Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-wide">
              Recent Transactions
            </h2>
            <p className="text-xs text-[#64748b] font-mono">
              {txEvents.length} total
            </p>
          </div>

          {txEvents.length === 0 ? (
            <p className="text-sm text-[#64748b] py-8 text-center italic">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-[#64748b]">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-[#64748b]">
                      Parties
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-[#64748b]">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-widest text-[#64748b]">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-widest text-[#64748b]">
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e2e8f0] rounded-xl bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-[#1e293b]">
        {value}
      </p>
    </div>
  );
}

function ActivityRow({ event }: { event: TxEvent }) {
  const orderId = event.txHash?.slice(0, 8).toUpperCase() || event.id.slice(-6).toUpperCase();
  const statusLabel = STATUS_LABEL[event.kind] || event.kind;
  const statusColor = KIND_COLOR[event.kind] || "text-slate-600 bg-slate-50 border-slate-100";

  return (
    <tr className="border-b border-[#e2e8f0] hover:bg-slate-50 transition-colors">
      <td className="py-4 px-4">
        <code className="text-xs font-mono font-bold text-[#3b82f6]">
          ORD-{orderId}
        </code>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#64748b]">
          <span className="font-bold">
            {event.party === "alice" ? "Buyer" : event.party === "bob" ? "Seller" : "Mediator"}
          </span>
          <span className="text-[#94a3b8]">
            {event.toAddress?.slice(0, 8) || "addr1..."}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`text-xs px-3 py-1 rounded-lg border font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </td>
      <td className="py-4 px-4 text-right font-mono font-bold text-[#1e293b]">
        {event.amount ? (
          <span>
            {(event.amount / 1_000_000).toFixed(2)} ₳
          </span>
        ) : (
          <span className="text-[#cbd5e1]">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-xs text-[#64748b]">
          {formatTime(event.timestamp)}
        </span>
      </td>
    </tr>
  );
}
