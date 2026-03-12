type Props = {
  amount: string;
  recipient: string;
  description: string;
  txHash: string;
  onReset: () => void;
};

export function EscrowCompleted({ amount, recipient, description, txHash, onReset }: Props) {
  return (
    <section className="bg-white border border-green-200 rounded-lg p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Escrow Complete</h2>
        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
          ✓ Done
        </span>
      </div>

      <div className="bg-green-50 rounded-md p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Recipient</span>
          <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[60%]">
            {recipient.slice(0, 12)}…{recipient.slice(-6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount Paid</span>
          <span className="font-semibold text-gray-900">{(Number(amount) / 1_000_000).toFixed(2)} ADA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Note</span>
          <span className="text-gray-800 text-right max-w-[60%]">{description}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tx</span>
          <span className="font-mono text-xs text-gray-500 break-all text-right max-w-[60%]">{txHash}</span>
        </div>
      </div>

      <p className="text-sm text-green-700 text-center mb-4">
        Payment successfully released.
      </p>

      <button
        onClick={onReset}
        className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        Start New Escrow
      </button>
    </section>
  );
}
