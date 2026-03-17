import type { TxEvent, Party } from "@/lib/types";
import { PARTY_ADDRESSES } from "@/lib/types";

const KIND_TAG: Record<TxEvent["kind"], string> = {
  direct_send:           "Send",
  escrow_lock:           "Protected",
  escrow_release:        "Released",
  escrow_dispute:        "Reported",
  escrow_resolve_pay:    "Paid",
  escrow_resolve_refund: "Refunded",
  head_open:             "Active",
  head_close:            "Closing",
  head_fanout:           "Withdrawn",
};

const KIND_COLOR: Record<TxEvent["kind"], string> = {
  direct_send:           "text-blue-400",
  escrow_lock:           "text-amber-400",
  escrow_release:        "text-green-400",
  escrow_dispute:        "text-orange-400",
  escrow_resolve_pay:    "text-green-400",
  escrow_resolve_refund: "text-blue-400",
  head_open:             "text-green-400",
  head_close:            "text-red-400",
  head_fanout:           "text-purple-400",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

const HEAD_KINDS = new Set<TxEvent["kind"]>(["head_open", "head_close", "head_fanout"]);

type Props = {
  events: TxEvent[];
  filterParty?: Party;
  emptyText?: string;
};

export function TransactionFeed({ events, filterParty, emptyText }: Props) {
  // Filter events: show either initiated by this party OR sent to this party's address
  const visible = (filterParty
    ? events.filter((e) => {
        const isInitiator = e.party === filterParty;
        const isReceiver = e.toAddress === PARTY_ADDRESSES[filterParty];
        return isInitiator || isReceiver;
      })
    : events
  ).filter((e) => !HEAD_KINDS.has(e.kind));

  if (visible.length === 0) {
    return (
      <p className="text-xs font-mono text-zinc-600 py-4">
        // {emptyText ?? "no activity yet"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {visible.map((e) => (
        <div
          key={e.id}
          className="flex flex-col gap-0.5 border-b border-zinc-800 py-2.5 last:border-0"
        >
          {/* Log line */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-600 flex-shrink-0">{formatTime(e.timestamp)}</span>
            <span className="text-zinc-700">·</span>
            {!filterParty && (
              <>
                <span className="text-zinc-400">{e.party}</span>
                <span className="text-zinc-700">·</span>
              </>
            )}
            <span className={`font-semibold ${KIND_COLOR[e.kind]}`}>{KIND_TAG[e.kind]}</span>
            {e.amount != null && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-300">{(e.amount / 1_000_000).toFixed(2)} ADA</span>
              </>
            )}
          </div>

          {/* Meta details */}
          {(e.description || e.disputeReason || e.txHash) && (
            <div className="pl-16 flex flex-col gap-0.5">
              {e.description && (
                <span className="text-xs font-mono text-zinc-600">note: {e.description}</span>
              )}
              {e.disputeReason && (
                <span className="text-xs font-mono text-orange-600">issue: {e.disputeReason}</span>
              )}
              {e.txHash && (
                <span className="text-xs font-mono text-zinc-700 truncate">id: {e.txHash.slice(0, 20)}…</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
