import { useState } from "react";

type Props = {
  isOpen: boolean;
  loading: boolean;
  onSend: (toAddress: string, lovelace: number) => void;
};

export function DirectTransferForm({ isOpen, loading, onSend }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount,    setAmount]    = useState("");
  const [lastHash,  setLastHash]  = useState("");

  const disabled = !isOpen || !recipient || !amount || loading;

  async function handleSubmit() {
    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (lovelace <= 0) return;
    const hash = await (onSend(recipient, lovelace) as any);
    if (hash) {
      setLastHash(hash);
      setRecipient("");
      setAmount("");
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Direct Transfer
      </h2>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="addr_test1..."
            disabled={!isOpen || loading}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount (ADA)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            disabled={!isOpen || loading}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="mt-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
          ) : (
            "Send Now"
          )}
        </button>

        {!isOpen && (
          <p className="text-xs text-gray-400 text-center">Head must be Open to send.</p>
        )}

        {lastHash && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">Transfer sent</p>
            <p className="font-mono text-xs text-gray-600 break-all">{lastHash}</p>
          </div>
        )}
      </div>
    </section>
  );
}
