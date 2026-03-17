"use client";

import { useState } from "react";
import { useHeadState } from "@/lib/hooks/useHeadState";
import { useEscrowStore, useL2CounterStore } from "@/lib/escrow-store";
import { useTxLogStore } from "@/lib/tx-log-store";
import { Navbar } from "@/app/components/shared/Navbar";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/alice", label: "Alice (Buyer)" },
  { href: "/bob", label: "Bob (Seller)" },
  { href: "/carol", label: "Carol (Mediator)" },
  { href: "/explorer", label: "Public Ledger" },
] as const;

export default function DashboardPage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const headTag = useHeadState("alice");
  const escrows = useEscrowStore((s) => s.escrows);
  const activeEscrow = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
  const escrowStatus = activeEscrow?.status || "IDLE";
  const amount = activeEscrow?.amount || "0";
  const description = activeEscrow?.description || "";
  const events = useTxLogStore((s) => s.events);
  const { l2TxCount } = useL2CounterStore();

  // Open payment channel - runs init + all commits + polls until Open
  async function openPaymentChannel() {
    setLoadingAction("opening");
    try {
      setProgressMessage("Creating payment room...");
      await fetch("/api/hydra/init", { method: "POST" });
      await new Promise((r) => setTimeout(r, 2000));

      setProgressMessage("Alice is joining the room...");
      await fetch("/api/commit", { method: "POST", body: JSON.stringify({ party: "alice" }) });

      setProgressMessage("Bob is joining the room...");
      await fetch("/api/commit", { method: "POST", body: JSON.stringify({ party: "bob" }) });

      setProgressMessage("Carol is joining the room...");
      await fetch("/api/commit", { method: "POST", body: JSON.stringify({ party: "carol" }) });

      await new Promise((r) => setTimeout(r, 5000));
      setProgressMessage("Opening payment channel on Layer 2...");
      
      let attempts = 0;
      while (attempts < 40) {
        const res = await fetch("http://localhost:8082/hydra/query/head");
        const data = await res.json();
        const tag = data.tag ?? data.state;
        if (tag === "Open") break;
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
      }
      setLoadingAction(null);
    } catch (err) {
      setProgressMessage("Error: " + (err instanceof Error ? err.message : String(err)));
      setLoadingAction(null);
    }
  }

  async function closePaymentChannel() {
    setLoadingAction("closing");
    try {
      setProgressMessage("Closing payment channel...");
      await fetch("/api/close", { method: "POST" });
      setProgressMessage("Waiting for settlement...");
      
      let attempts = 0;
      while (attempts < 40) {
        const res = await fetch("http://localhost:8082/hydra/query/head");
        const data = await res.json();
        const tag = data.tag ?? data.state;
        if (tag === "FanoutPossible") break;
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
      }
      setProgressMessage("Fanout logic triggered...");
      await fetch("/api/fanout", { method: "POST" });
      setLoadingAction(null);
    } catch (err) {
      setProgressMessage("Error: " + (err instanceof Error ? err.message : String(err)));
      setLoadingAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your Layer 2 payment channels and escrow sessions.</p>
          </div>
          <div className="flex gap-4">
            {headTag === "Idle" && (
              <button 
                onClick={openPaymentChannel}
                disabled={!!loadingAction}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-sm"
              >
                {loadingAction === "opening" ? "Opening..." : "Create Payment Room"}
              </button>
            )}
            {headTag === "Open" && (
              <button 
                onClick={closePaymentChannel}
                disabled={!!loadingAction}
                className="border border-slate-200 bg-white text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm"
              >
                {loadingAction === "closing" ? "Closing..." : "Close Room & Settle"}
              </button>
            )}
          </div>
        </header>

        {loadingAction && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm font-medium animate-pulse">
            {progressMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Controls/Status */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Network Overview Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold mb-6">Network Overview</h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
                  <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${headTag === "Open" ? "bg-green-500" : "bg-slate-300"}`}></span>
                    {headTag}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Latency</label>
                  <p className="text-xl font-bold text-slate-900">~800ms</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Savings</label>
                  <p className="text-xl font-bold text-green-600">{(l2TxCount * 0.17).toFixed(2)} ADA</p>
                </div>
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {QUICK_LINKS.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{link.label}</h3>
                  <p className="text-slate-500 text-sm mt-1">Open interface for this participant role.</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold">Activity</h2>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {events.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No recent activity detected.</p>
                ) : (
                  events
                    .filter((ev) => ev.kind !== "head_open" && ev.kind !== "head_close")
                    .slice()
                    .reverse()
                    .map((ev, i) => {
                      const getMessage = () => {
                        switch (ev.kind) {
                          case "escrow_lock": return `Escrow locked: ${ev.description}`;
                          case "escrow_release": return `Payment released`;
                          case "escrow_dispute": return `Dispute raised`;
                          case "direct_send": return `Transfer sent`;
                          default: return ev.kind;
                        }
                      };
                      return (
                        <div key={i} className="border-l-2 border-slate-100 pl-4 py-1">
                          <p className="text-sm font-medium text-slate-900 leading-snug">{getMessage()}</p>
                          <p className="text-xs text-slate-400 mt-1">Layer 2 • Instant</p>
                        </div>
                      );
                    })
                )}
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
