"use client";

import { useState } from "react";
import { BuyerTab }    from "@/app/components/buyer/BuyerTab";
import { SellerTab }   from "@/app/components/seller/SellerTab";
import { MediatorTab } from "@/app/components/mediator/MediatorTab";
import Link from "next/link";

type Tab = "buyer" | "seller" | "mediator";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "buyer",    label: "buyer",    sub: "alice"  },
  { id: "seller",   label: "seller",   sub: "bob"    },
  { id: "mediator", label: "mediator", sub: "carol"  },
];

export default function DashboardPage() {
  const [active, setActive] = useState<Tab>("buyer");

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto py-10 px-6">

        {/* Page header */}
        <div className="mb-8 border-b border-zinc-800 pb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">hydra_settlement</p>
            <p className="text-xs font-mono text-zinc-700">// observer dashboard</p>
          </div>
          <Link
            href="/explorer"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
          >
            &gt; public_ledger
          </Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border border-zinc-800 bg-zinc-900 rounded p-1 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded text-xs font-mono transition-colors ${
                active === t.id
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <span className="uppercase tracking-wide">{t.label}</span>
              <span className="text-zinc-700 mt-0.5">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {active === "buyer"    && <BuyerTab />}
        {active === "seller"   && <SellerTab />}
        {active === "mediator" && <MediatorTab />}

      </div>
    </main>
  );
}

