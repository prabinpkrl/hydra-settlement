"use client";

import Link from "next/link";
import { Navbar } from "@/app/components/shared/Navbar";
import { BuyerTab } from "@/app/components/buyer/BuyerTab";
import { usePartyUtxos } from "@/lib/hooks/usePartyUtxos";

export default function AlicePage() {
  const { balance } = usePartyUtxos("alice");
  const adaBalance = (balance / 1000000).toFixed(2);
  const address = "addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4";

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Card */}
        <header className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1e293b]">Alice</h1>
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] px-2 py-1 rounded bg-[#f1f5f9] border border-[#e2e8f0]">Buyer</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-xs text-[#64748b] font-mono">{address.slice(0, 8)}...{address.slice(-6)}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(address)}
                className="text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors"
              >
                copy
              </button>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1">Available ADA</p>
            <p className="text-4xl font-bold text-[#1e293b]">{adaBalance} ADA</p>
          </div>
        </header>

        <BuyerTab />
      </div>
    </main>
  );
}
