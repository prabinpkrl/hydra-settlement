import { useL2CounterStore } from "@/lib/escrow-store";

export function SavingsSummaryCard() {
  const { l2TxCount } = useL2CounterStore();

  return (
    <div className="border border-slate-700 rounded-xl bg-slate-800 p-4">
      <p className="text-sm text-white font-bold mb-4 flex items-center gap-2">
        💰 Your Savings
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left: Transactions on L2 */}
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Transactions on L2</p>
          <p className="text-2xl font-mono text-white font-bold">{l2TxCount}</p>
        </div>
        
        {/* Right: Total Fees Saved */}
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Total Fees Saved</p>
          <p className="text-2xl font-mono text-green-400 font-bold">~{(l2TxCount * 0.17).toFixed(2)} ADA</p>
        </div>
      </div>
      
      <p className="text-xs text-zinc-600 text-center">
        vs sending same transactions on Cardano L1
      </p>
    </div>
  );
}
