type Props = {
  amount: string;
  recipient: string;
  description: string;
  disputeReason: string;
};

export function EscrowDisputed({ amount, recipient, description, disputeReason }: Props) {
  return (
    <section className="bg-white border border-orange-200 rounded-lg p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Dispute Raised</h2>
        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200">
          Disputed
        </span>
      </div>

      <div className="bg-orange-50 rounded-md p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Recipient</span>
          <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[60%]">
            {recipient.slice(0, 12)}…{recipient.slice(-6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-semibold text-gray-900">{(Number(amount) / 1_000_000).toFixed(2)} ADA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Note</span>
          <span className="text-gray-800 text-right max-w-[60%]">{description}</span>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
        <p className="text-xs font-semibold text-orange-700 mb-1">Dispute Reason</p>
        <p className="text-sm text-orange-800">{disputeReason}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-md p-3">
        <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Waiting for mediator (Carol) to resolve…
      </div>
    </section>
  );
}
