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
    <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        L2 Balance
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !isOpen ? (
        <p className="text-sm text-gray-400">Head must be Open to view L2 funds.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400">No funds at this address.</p>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            {(balance / 1_000_000).toFixed(2)}{" "}
            <span className="text-base font-normal text-gray-500">ADA</span>
          </div>
          <div className="flex flex-col gap-2">
            {entries.map(([ref, u]) => (
              <div
                key={ref}
                className="flex items-center justify-between text-sm border-t border-gray-100 pt-2"
              >
                <span className="font-mono text-gray-500 text-xs">{shortRef(ref)}</span>
                <span className="text-gray-800 font-medium">
                  {(u.value.lovelace / 1_000_000).toFixed(2)} ADA
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
