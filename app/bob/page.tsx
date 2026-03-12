import Link from "next/link";
import { SellerTab } from "@/app/components/seller/SellerTab";

export default function BobPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto py-10 px-6">
        
        {/* Header */}
        <div className="mb-8 border-b border-zinc-800 pb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">
              hydra_settlement
            </p>
            <p className="text-xs font-mono text-zinc-700">
              // bob · seller interface
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/explorer"
              className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              ledger
            </Link>
            <Link
              href="/"
              className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              &lt; home
            </Link>
          </div>
        </div>

        <SellerTab />

      </div>
    </main>
  );
}
