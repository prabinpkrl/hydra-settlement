import { useState } from "react";

type Props = {
  isOpen: boolean;
  loading: boolean;
  amount: string;
  description: string;
  recipient: string;
  txHash: string;
  onRelease: () => void;
  onCancel: () => void;
  onDispute: (reason: string) => void;
};

export function EscrowActive({
  isOpen, loading, amount, description,
  recipient, txHash, onRelease, onCancel, onDispute,
}: Props) {
  const [showDispute,   setShowDispute]   = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  function submitDispute() {
    if (!disputeReason.trim()) return;
    onDispute(disputeReason.trim());
    setShowDispute(false);
    setDisputeReason("");
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Escrow Active</h2>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-200">
          Awaiting Delivery
        </span>
      </div>

      <div className="bg-gray-50 rounded-md p-4 mb-4 space-y-2 text-sm">
        <Row label="Recipient" value={`${recipient.slice(0, 12)}…${recipient.slice(-6)}`} mono />
        <Row label="Amount"    value={`${(Number(amount) / 1_000_000).toFixed(2)} ADA`} bold />
        <Row label="Note"      value={description} />
        <Row label="Lock Tx"   value={`${txHash.slice(0, 10)}…${txHash.slice(-6)}`} mono />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRelease}
          disabled={!isOpen || loading}
          className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : "Release Payment"}
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full bg-gray-100 text-gray-600 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel Escrow
        </button>

        {!showDispute ? (
          <button
            onClick={() => setShowDispute(true)}
            disabled={loading}
            className="w-full bg-orange-50 text-orange-700 border border-orange-200 rounded-md py-2 text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            Raise Dispute
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Reason for dispute</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-400"
            />
            <div className="flex gap-2">
              <button
                onClick={submitDispute}
                disabled={!disputeReason.trim() || loading}
                className="flex-1 bg-orange-500 text-white rounded-md py-2 text-sm font-medium hover:bg-orange-400 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
              >
                Submit
              </button>
              <button
                onClick={() => { setShowDispute(false); setDisputeReason(""); }}
                className="flex-1 bg-gray-100 text-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`text-right max-w-[60%] break-all ${mono ? "font-mono text-xs text-gray-600" : ""} ${bold ? "font-semibold text-gray-900" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Releasing...</>;
}
