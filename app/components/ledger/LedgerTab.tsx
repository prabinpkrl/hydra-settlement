"use client";

import { useTxLogStore } from "@/lib/tx-log-store";
import { TransactionFeed } from "@/app/components/ui/TransactionFeed";

export function LedgerTab() {
  const events = useTxLogStore((s) => s.events);
  const clear  = useTxLogStore((s) => s.clear);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Public Ledger</h2>
          <p className="text-xs text-gray-400 mt-0.5">All activity across all parties, newest first.</p>
        </div>
        {events.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <TransactionFeed
          events={events}
          emptyText="No transactions yet. Activity will appear here in real time."
        />
      </div>
    </div>
  );
}
