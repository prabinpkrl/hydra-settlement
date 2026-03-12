import type { TxEvent, Party } from "@/lib/types";

const KIND_LABELS: Record<TxEvent["kind"], string> = {
  direct_send:          "Direct Send",
  escrow_lock:          "Escrow Locked",
  escrow_release:       "Payment Released",
  escrow_dispute:       "Dispute Raised",
  escrow_resolve_pay:   "Dispute → Pay Seller",
  escrow_resolve_refund:"Dispute → Refund Buyer",
  head_open:            "Head Opened",
  head_close:           "Head Closed",
  head_fanout:          "Head Fanout",
};

const KIND_COLOR: Record<TxEvent["kind"], string> = {
  direct_send:          "text-blue-700 bg-blue-50 border-blue-200",
  escrow_lock:          "text-yellow-800 bg-yellow-50 border-yellow-200",
  escrow_release:       "text-green-800 bg-green-50 border-green-200",
  escrow_dispute:       "text-orange-800 bg-orange-50 border-orange-200",
  escrow_resolve_pay:   "text-green-800 bg-green-50 border-green-200",
  escrow_resolve_refund:"text-blue-800 bg-blue-50 border-blue-200",
  head_open:            "text-green-800 bg-green-50 border-green-200",
  head_close:           "text-red-800 bg-red-50 border-red-200",
  head_fanout:          "text-purple-800 bg-purple-50 border-purple-200",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function partyLabel(p: Party) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

type Props = {
  events: TxEvent[];
  /** If provided, only shows events for this party. */
  filterParty?: Party;
  emptyText?: string;
};

export function TransactionFeed({ events, filterParty, emptyText }: Props) {
  const visible = filterParty
    ? events.filter((e) => e.party === filterParty)
    : events;

  if (visible.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        {emptyText ?? "No activity yet."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visible.map((e) => (
        <div
          key={e.id}
          className={`rounded-lg border px-4 py-3 text-sm ${KIND_COLOR[e.kind]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">{KIND_LABELS[e.kind]}</span>
            <span className="text-xs opacity-60">{formatTime(e.timestamp)}</span>
          </div>

          <div className="text-xs opacity-75 space-y-0.5">
            {!filterParty && (
              <p>By <span className="font-medium">{partyLabel(e.party)}</span></p>
            )}
            {e.amount != null && (
              <p>Amount: <span className="font-medium">{(e.amount / 1_000_000).toFixed(2)} ADA</span></p>
            )}
            {e.description && (
              <p>Note: {e.description}</p>
            )}
            {e.disputeReason && (
              <p>Reason: {e.disputeReason}</p>
            )}
            {e.txHash && (
              <p className="font-mono truncate">Tx: {e.txHash.slice(0, 16)}…</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
