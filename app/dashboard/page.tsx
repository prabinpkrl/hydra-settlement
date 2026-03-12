"use client";

import { useState } from "react";
import { BuyerTab }    from "@/app/components/buyer/BuyerTab";
import { SellerTab }   from "@/app/components/seller/SellerTab";
import { MediatorTab } from "@/app/components/mediator/MediatorTab";
import { LedgerTab }   from "@/app/components/ledger/LedgerTab";

type Tab = "buyer" | "seller" | "mediator" | "ledger";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "buyer",    label: "Buyer",    sub: "Alice"  },
  { id: "seller",   label: "Seller",   sub: "Bob"    },
  { id: "mediator", label: "Mediator", sub: "Carol"  },
  { id: "ledger",   label: "Ledger",   sub: "Public" },
];

export default function DashboardPage() {
  const [active, setActive] = useState<Tab>("buyer");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-6">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hydra Settlement</h1>
          <p className="text-sm text-gray-500 mt-1">L2 Escrow Dashboard</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-md text-sm font-medium transition-colors ${
                active === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{t.label}</span>
              <span className="text-xs font-normal opacity-60">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {active === "buyer"    && <BuyerTab />}
        {active === "seller"   && <SellerTab />}
        {active === "mediator" && <MediatorTab />}
        {active === "ledger"   && <LedgerTab />}

      </div>
    </main>
  );
}
