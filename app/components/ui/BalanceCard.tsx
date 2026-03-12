import type { UtxoMap } from "@/lib/types";

function shortRef(ref: string) {
  const [hash, idx] = ref.split("#");
  return `${hash.slice(0, 8)}...${hash.slice(-4)}#${idx}`;
}

type Props = {
  balance: number;
  utxos: UtxoMap;
  loading: boolean;
  isOpen: boolean;
};

export function BalanceCard({ balance, utxos, loading, isOpen }: Props) {
  const entries = Object.entries(utxos);

  return (
    <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">l2_balance</p>

      {loading ? (
        <p className="text-xs text-zinc-600 font-mono">fetching...</p>
      ) : !isOpen ? (
        <p className="text-xs text-zinc-600 font-mono">// head not open</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-zinc-600 font-mono">// no utxos at this address</p>
      ) : (
        <>
          <div className="text-3xl font-mono font-bold text-green-400 mb-3">
            {(balance / 1_000_000).toFixed(2)}{" "}
            <span className="text-lg font-normal text-zinc-500">ADA</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {entries.map(([ref, u]) => (
              <div
                key={ref}
                className="flex items-center justify-between text-xs font-mono border-t border-zinc-800 pt-1.5"
              >
                <span className="text-zinc-600">{shortRef(ref)}</span>
                <span className="text-zinc-300">{(u.value.lovelace / 1_000_000).toFixed(2)} ADA</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
