type Props = {
  amount: string;
  recipient: string;
  description: string;
  txHash: string;
  onReset: () => void;
};

export function EscrowCompleted({ amount, recipient, description, txHash, onReset }: Props) {
  return (
    <section className="border border-green-900 rounded bg-zinc-900 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">escrow_complete</p>
        <span className="text-xs font-mono text-green-400 border border-green-800 rounded px-2 py-0.5">SETTLED</span>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-4 flex flex-col gap-1.5 text-xs font-mono">
        <KV k="recipient" v={`${recipient.slice(0, 14)}...${recipient.slice(-6)}`} />
        <KV k="amount_paid" v={`${(Number(amount) / 1_000_000).toFixed(2)} ADA`} highlight />
        <KV k="note" v={description} />
        <KV k="release_tx" v={txHash} full />
      </div>

      <p className="text-xs font-mono text-green-600 mb-3">// payment successfully released to recipient</p>

      <button
        onClick={onReset}
        className="w-full border border-zinc-700 text-zinc-300 rounded px-3 py-2 text-xs font-mono text-left
          hover:bg-zinc-800 transition-colors"
      >
        start new escrow
      </button>
    </section>
  );
}

function KV({ k, v, highlight, full }: { k: string; v: string; highlight?: boolean; full?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-600 flex-shrink-0">{k}:</span>
      <span className={`break-all ${highlight ? "text-green-400 font-semibold" : full ? "text-zinc-600" : "text-zinc-400"}`}>{v}</span>
    </div>
  );
}
