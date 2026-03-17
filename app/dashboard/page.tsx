"use client";

import { useState } from "react";
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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const headTag = useHeadState("alice");
  const aliceUtxos = usePartyUtxos("alice");
  const bobUtxos = usePartyUtxos("bob");
  const carolUtxos = usePartyUtxos("carol");
  const { status: escrowStatus, amount, description } = useEscrowStore();
  const events = useTxLogStore((s) => s.events);

  // Open payment channel - runs init + all commits + polls until Open
  async function openPaymentChannel() {
    console.log("[DASHBOARD-OPEN] Starting payment channel creation...");
    setLoadingAction("opening");

    try {
      setProgressMessage("Creating payment room...");
      console.log("[DASHBOARD-OPEN] Step 1: Calling /api/hydra/init");
      const initRes = await fetch("/api/hydra/init", { method: "POST" });
      console.log("[DASHBOARD-OPEN] Init response:", initRes.status, initRes.ok);
      if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);
      await new Promise((r) => setTimeout(r, 2000));

      setProgressMessage("Alice is joining the room...");
      console.log("[DASHBOARD-OPEN] Step 2: Alice commit");
      const aliceRes = await fetch("/api/commit", {
        method: "POST",
        body: JSON.stringify({ party: "alice" }),
      });
      console.log("[DASHBOARD-OPEN] Alice commit:", aliceRes.status);
      if (!aliceRes.ok) throw new Error(`Alice commit failed: ${aliceRes.status}`);

      setProgressMessage("Bob is joining the room...");
      console.log("[DASHBOARD-OPEN] Step 3: Bob commit");
      const bobRes = await fetch("/api/commit", {
        method: "POST",
        body: JSON.stringify({ party: "bob" }),
      });
      console.log("[DASHBOARD-OPEN] Bob commit:", bobRes.status);
      if (!bobRes.ok) throw new Error(`Bob commit failed: ${bobRes.status}`);

      setProgressMessage("Carol is joining the room...");
      console.log("[DASHBOARD-OPEN] Step 4: Carol commit");
      const carolRes = await fetch("/api/commit", {
        method: "POST",
        body: JSON.stringify({ party: "carol" }),
      });
      console.log("[DASHBOARD-OPEN] Carol commit:", carolRes.status);
      if (!carolRes.ok) throw new Error(`Carol commit failed: ${carolRes.status}`);

      // Wait longer after all commits before polling - Hydra needs time to process
      console.log("[DASHBOARD-OPEN] Waiting 5 seconds for Hydra to process commits...");
      await new Promise((r) => setTimeout(r, 5000));

      setProgressMessage("⚡ Opening payment channel on Layer 2...");
      console.log("[DASHBOARD-OPEN] Step 5: Polling for Open state");
      // Poll until Open
      let attempts = 0;
      let lastState = null;
      while (attempts < 40) {
        try {
          const res = await fetch("http://localhost:8082/hydra/query/head");
          if (!res.ok) {
            console.warn(`[DASHBOARD-OPEN] Query failed: ${res.status}`);
            await new Promise((r) => setTimeout(r, 3000));
            attempts++;
            continue;
          }
          const data = await res.json();
          const tag = data.tag ?? data.state;
          lastState = tag;
          console.log(`[DASHBOARD-OPEN] Poll #${attempts + 1}: state = ${tag}`);
          if (tag === "Open") {
            console.log("[DASHBOARD-OPEN] ✅ Head is OPEN!");
            break;
          }
        } catch (e) {
          console.warn(`[DASHBOARD-OPEN] Poll error:`, e);
        }
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
      }

      if (attempts >= 40) {
        console.error(`[DASHBOARD-OPEN] Timeout after 40 attempts. Final state: ${lastState}`);
        throw new Error(`Timeout after 2 min. State stuck at: ${lastState}`);
      }

      setProgressMessage("✅ Payment channel is open!");
      console.log("[DASHBOARD-OPEN] SUCCESS");
      setLoadingAction(null);
    } catch (err) {
      console.error("[DASHBOARD-OPEN] ERROR:", err);
      setProgressMessage("❌ " + (err instanceof Error ? err.message : String(err)));
      setLoadingAction(null);
    }
  }

  // Close payment channel - runs close + polls until FanoutPossible + fanout
  async function closePaymentChannel() {
    console.log("[DASHBOARD-CLOSE] Starting payment channel closure...");
    setLoadingAction("closing");

    try {
      setProgressMessage("Closing payment channel...");
      console.log("[DASHBOARD-CLOSE] Step 1: Calling /api/close");
      const closeRes = await fetch("/api/close", { method: "POST" });
      console.log("[DASHBOARD-CLOSE] Close response:", closeRes.status);
      if (!closeRes.ok) throw new Error(`Close failed: ${closeRes.status}`);

      setProgressMessage("Waiting for settlement...");
      console.log("[DASHBOARD-CLOSE] Step 2: Polling for FanoutPossible");
      // Poll until FanoutPossible
      let attempts = 0;
      let lastState = null;
      while (attempts < 40) {
        try {
          const res = await fetch("http://localhost:8082/hydra/query/head");
          if (!res.ok) {
            console.warn(`[DASHBOARD-CLOSE] Query failed: ${res.status}`);
            await new Promise((r) => setTimeout(r, 3000));
            attempts++;
            continue;
          }
          const data = await res.json();
          const tag = data.tag ?? data.state;
          lastState = tag;
          console.log(`[DASHBOARD-CLOSE] Poll #${attempts + 1}: state = ${tag}`);
          if (tag === "FanoutPossible") {
            console.log("[DASHBOARD-CLOSE] ✅ FanoutPossible reached!");
            break;
          }
        } catch (e) {
          console.warn(`[DASHBOARD-CLOSE] Poll error:`, e);
        }
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
      }

      if (attempts >= 40) {
        console.error(`[DASHBOARD-CLOSE] Timeout after 40 attempts. Final state: ${lastState}`);
        throw new Error(`Timeout. State: ${lastState}`);
      }

      setProgressMessage("Withdrawing funds to Cardano...");
      console.log("[DASHBOARD-CLOSE] Step 3: Calling /api/fanout");
      const fanoutRes = await fetch("/api/fanout", { method: "POST" });
      console.log("[DASHBOARD-CLOSE] Fanout response:", fanoutRes.status);
      if (!fanoutRes.ok) throw new Error(`Fanout failed: ${fanoutRes.status}`);

      setProgressMessage("✅ Funds withdrawn to Cardano!");
      console.log("[DASHBOARD-CLOSE] SUCCESS");
      setLoadingAction(null);
    } catch (err) {
      console.error("[DASHBOARD-CLOSE] ERROR:", err);
      setProgressMessage("❌ " + (err instanceof Error ? err.message : String(err)));
      setLoadingAction(null);
    }
  }

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
            Active Payments
          </p>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Active Payments" value={activeEscrows} />
            <MetricCard label="Pending Issues" value={disputes} highlight={disputes > 0} />
            <MetricCard label="Completed" value={completedCount} />
            <MetricCard label="Total Volume" value={`${(totalVolume / 1_000_000).toFixed(1)} ADA`} />
          </div>
        </div>

        {/* Payment Room Status & Controls */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
              Payment Room Status
            </p>
            <HeadStatusBadge tag={headTag} />
          </div>
          <p className="text-xs font-mono text-zinc-500 mb-4">
            Members: <span className="text-zinc-400">Buyer, Seller, Dispute Resolver</span>
          </p>

          {/* Loading State */}
          {loadingAction && (
            <div className="bg-zinc-800 rounded p-6 text-center">
              <div className="flex justify-center mb-4">
                <span className="inline-block w-8 h-8 border-4 border-zinc-600 border-t-blue-400 rounded-full animate-spin" />
              </div>
              <p className="text-sm font-mono text-zinc-200 mb-2">{progressMessage}</p>
              <p className="text-xs font-mono text-zinc-600">Please wait, do not close this page</p>
            </div>
          )}

          {/* Idle State - Show Open Button */}
          {headTag === "Idle" && !loadingAction && (
            <button
              onClick={openPaymentChannel}
              className="w-full bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 rounded px-4 py-3 text-sm font-mono text-blue-400 transition-colors"
            >
              ⚡ Open Payment Channel
            </button>
          )}

          {/* Initial State - Show loading with setup message */}
          {headTag === "Initial" && !loadingAction && (
            <div className="bg-zinc-800 rounded p-6 text-center">
              <div className="flex justify-center mb-4">
                <span className="inline-block w-8 h-8 border-4 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
              </div>
              <p className="text-sm font-mono text-zinc-200">Setting up payment channel...</p>
            </div>
          )}

          {/* Open State - Show Close Button */}
          {headTag === "Open" && !loadingAction && (
            <button
              onClick={closePaymentChannel}
              className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 rounded px-4 py-3 text-sm font-mono text-red-400 transition-colors"
            >
              Close & Withdraw to Cardano
            </button>
          )}
        </div>

        {/* Available Balances */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            Available Balances
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
            Activity
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
        {loading ? "..." : `${(balance / 1_000_000).toFixed(2)} ADA`}
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
    if (event.kind === "escrow_lock") return `protected ${(event.amount! / 1_000_000).toFixed(1)} ADA`;
    if (event.kind === "escrow_release") return `released ${(event.amount! / 1_000_000).toFixed(1)} ADA`;
    if (event.kind === "direct_send") return `sent ${(event.amount! / 1_000_000).toFixed(1)} ADA`;
    if (event.kind === "escrow_dispute") return "reported issue";
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

