import { useState } from "react";
import { PARTY_ADDRESSES } from "@/lib/types";

type Props = {
  isOpen: boolean;
  loading: boolean;
  onLock: (recipient: string, lovelace: number, description: string) => void;
};

export function EscrowForm({ isOpen, loading, onLock }: Props) {
  const [recipient,    setRecipient]    = useState(PARTY_ADDRESSES.bob);
  const [amount,       setAmount]       = useState("");
  const [description,  setDescription]  = useState("");

  const disabled = !isOpen || !recipient || !amount || !description || loading;

  function handleSubmit() {
    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (lovelace <= 0) return;
    onLock(recipient, lovelace, description);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        New Escrow
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

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Freelance payment for logo design"
            disabled={!isOpen || loading}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="mt-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Locking...</>
          ) : (
            "Lock Funds"
          )}
        </button>

        {!isOpen && (
          <p className="text-xs text-gray-400 text-center">Head must be Open to lock funds.</p>
        )}
      </div>
    </section>
  );
}
