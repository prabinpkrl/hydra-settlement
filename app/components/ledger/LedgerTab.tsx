"use client";

import { useTxLogStore } from "@/lib/tx-log-store";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";

export function LedgerTab() {
  const events = useTxLogStore((s) => s.events);
  const clear  = useTxLogStore((s) => s.clear);

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-1">public_ledger</p>
          <p className="text-xs font-mono text-zinc-700">// all activity, newest first</p>
        </div>
        {events.length > 0 && (
          <button
            onClick={clear}
            className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0"
          >
            &gt; clear
          </button>
        )}
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <TransactionFeed
          events={events}
          emptyText="// no transactions yet"
        />
      </div>
    </div>
  );
}
