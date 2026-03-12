type Props = {
  dealId: string;
  amount: string;
  recipient: string;
  description: string;
  disputeReason: string;
};

export function EscrowDisputed({ dealId, amount, recipient, description, disputeReason }: Props) {
  return (
    <section className="border border-orange-900 rounded bg-zinc-900 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">escrow_disputed</p>
        <span className="text-xs font-mono text-orange-400 border border-orange-800 rounded px-2 py-0.5">DISPUTED</span>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-3 flex flex-col gap-1.5 text-xs font-mono">
        <KV k="deal_id" v={dealId} />
        <KV k="recipient" v={`${recipient.slice(0, 14)}...${recipient.slice(-6)}`} />
        <KV k="amount" v={`${(Number(amount) / 1_000_000).toFixed(2)} ADA`} />
        <KV k="note" v={description} />
      </div>

      <div className="border border-orange-900 rounded bg-zinc-950 p-3 mb-3">
        <p className="text-xs font-mono text-orange-600 mb-1">dispute_reason:</p>
        <p className="text-xs font-mono text-orange-400">{disputeReason}</p>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
        <span className="inline-block w-2.5 h-2.5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        waiting for mediator (carol) to resolve...
      </div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-600 flex-shrink-0">{k}:</span>
      <span className="text-zinc-400">{v}</span>
    </div>
  );
}
