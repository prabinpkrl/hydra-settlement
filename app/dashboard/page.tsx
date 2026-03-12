"use client";

import { useHeadState } from "@/lib/hooks/useHeadState";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";
import { useEscrowStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { HeadStatusBadge } from "@/app/components/ui/HeadStatusBadge";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/alice", label: "alice" },
  { href: "/bob", label: "bob" },
  { href: "/carol", label: "carol" },
  { href: "/explorer", label: "public_ledger" },
] as const;

export default function DashboardPage() {
  const headTag = useHeadState("alice");
  const aliceUtxos = usePartyUtxos("alice");
  const bobUtxos = usePartyUtxos("bob");
  const carolUtxos = usePartyUtxos("carol");
  const { status: escrowStatus, amount, description } = useEscrowStore();
  const events = useTxLogStore((s) => s.events);

  // Calculate metrics
  const activeEscrows = escrowStatus === "PENDING" ? 1 : 0;
  const disputes = escrowStatus === "DISPUTED" ? 1 : 0;
  const completedCount = events.filter((e) => e.kind === "escrow_release").length;
  const totalVolume = events
    .filter((e) => e.kind === "escrow_lock")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Recent activity (last 5 events)
  const recentActivity = events.slice(-5).reverse();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Header */}
        <div className="mb-6 border-b border-zinc-800 pb-5">
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">
            hydra_settlement
          </p>
          <p className="text-xs font-mono text-zinc-700">// observer dashboard</p>
        </div>

        {/* Quick Access Links */}
        <div className="mb-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            quick_access
          </p>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-zinc-800 text-zinc-300 rounded p-3 text-xs font-mono 
                  hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                &gt; {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="mb-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            system_metrics
          </p>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="active_escrows" value={activeEscrows} />
            <MetricCard label="disputes" value={disputes} highlight={disputes > 0} />
            <MetricCard label="completed" value={completedCount} />
            <MetricCard label="volume" value={`${(totalVolume / 1_000_000).toFixed(1)}₳`} />
          </div>
        </div>

        {/* Head Status */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
              head_status
            </p>
            <HeadStatusBadge tag={headTag} />
          </div>
          <p className="text-xs font-mono text-zinc-500">
            participants: <span className="text-zinc-400">alice, bob, carol</span>
          </p>
        </div>

        {/* Party Balances */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            party_balances
          </p>
          <div className="flex flex-col gap-2">
            <BalanceRow party="alice" role="buyer" balance={aliceUtxos.balance} loading={aliceUtxos.loading} />
            <BalanceRow party="bob" role="seller" balance={bobUtxos.balance} loading={bobUtxos.loading} />
            <BalanceRow party="carol" role="mediator" balance={carolUtxos.balance} loading={carolUtxos.loading} />
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            live_activity
          </p>
          {recentActivity.length === 0 ? (
            <p className="text-xs font-mono text-zinc-700">// no recent activity</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((event, idx) => (
                <ActivityItem key={idx} event={event} />
              ))}
            </div>
          )}
          <Link
            href="/explorer"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 mt-3 inline-block"
          >
            &gt; view full ledger
          </Link>
        </div>

      </div>
    </main>
  );
}

// Helper Components

function MetricCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`border rounded p-3 ${highlight ? "border-red-800 bg-red-950/20" : "border-zinc-800 bg-zinc-900"}`}>
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-xl font-mono font-bold ${highlight ? "text-red-300" : "text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}

function BalanceRow({ party, role, balance, loading }: { party: string; role: string; balance: number; loading: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="text-xs font-mono text-zinc-400">{party}</span>
        <span className="text-xs font-mono text-zinc-700 ml-2">// {role}</span>
      </div>
      <span className="text-xs font-mono text-zinc-300">
        {loading ? "..." : `${(balance / 1_000_000).toFixed(2)}₳`}
      </span>
    </div>
  );
}

function ActivityItem({ event }: { event: any }) {
  const getColor = () => {
    if (event.party === "alice") return "text-blue-300";
    if (event.party === "bob") return "text-green-300";
    if (event.party === "carol") return "text-purple-300";
    return "text-zinc-400";
  };

  const getAction = () => {
    if (event.kind === "escrow_lock") return `locked ${(event.amount! / 1_000_000).toFixed(1)}₳`;
    if (event.kind === "escrow_release") return `released ${(event.amount! / 1_000_000).toFixed(1)}₳`;
    if (event.kind === "direct_send") return `sent ${(event.amount! / 1_000_000).toFixed(1)}₳`;
    if (event.kind === "escrow_dispute") return "disputed escrow";
    if (event.kind === "escrow_resolve_pay") return "resolved (paid)";
    if (event.kind === "escrow_resolve_refund") return "resolved (refund)";
    return event.kind;
  };

  return (
    <div className="flex justify-between items-center text-xs font-mono">
      <div>
        <span className={getColor()}>{event.party}</span>
        <span className="text-zinc-600 mx-1">&gt;</span>
        <span className="text-zinc-500">{getAction()}</span>
      </div>
      <span className="text-zinc-700">{formatTime(event.timestamp)}</span>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // seconds
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

