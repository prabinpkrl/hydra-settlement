import { useState } from "react";
import { PARTY_ADDRESSES } from "@/lib/types";

type Escrow = {
  dealId: string;
  status: "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";
  amount: string;
  description: string;
  recipientAddress: string;
  disputeReason: string;
  txHash: string;
  createdAt?: number;
};

type Props = {
  escrows: Escrow[];
  isOpen: boolean;
  loading: boolean;
  onPaySeller: (dealId: string, sellerAddress: string, amount: string) => void;
  onRefundBuyer: (dealId: string, amount: string) => void;
};

export function DisputeList({ escrows, isOpen, loading, onPaySeller, onRefundBuyer }: Props) {
  // Filter for disputed escrows only
  const disputes = escrows.filter(e => e.status === "DISPUTED");

  if (disputes.length === 0) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs font-mono text-zinc-700">// no active disputes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
        active_disputes ({disputes.length})
      </p>
      {disputes.map((escrow) => (
        <DisputeCard
          key={escrow.dealId}
          escrow={escrow}
          isOpen={isOpen}
          loading={loading}
          onPaySeller={onPaySeller}
          onRefundBuyer={onRefundBuyer}
        />
      ))}
    </div>
  );
}

function DisputeCard({ escrow, isOpen, loading, onPaySeller, onRefundBuyer }: {
  escrow: Escrow;
  isOpen: boolean;
  loading: boolean;
  onPaySeller: (dealId: string, sellerAddress: string, amount: string) => void;
  onRefundBuyer: (dealId: string, amount: string) => void;
}) {
  const [resolved, setResolved] = useState(false);
  const [resolutionType, setResolutionType] = useState<"paid" | "refunded" | "">("");

  const handlePaySeller = () => {
    onPaySeller(escrow.dealId, escrow.recipientAddress, escrow.amount);
    setResolved(true);
    setResolutionType("paid");
  };

  const handleRefundBuyer = () => {
    onRefundBuyer(escrow.dealId, escrow.amount);
    setResolved(true);
    setResolutionType("refunded");
  };

  return (
    <section className="border border-orange-900 rounded bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-400">{escrow.dealId}</p>
        <span className="text-xs font-mono text-orange-400 border border-orange-800 rounded px-2 py-0.5">
          DISPUTED
        </span>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-3 flex flex-col gap-1.5 text-xs font-mono">
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">amount:</span>
          <span className="text-zinc-300 font-semibold">
            {(Number(escrow.amount) / 1_000_000).toFixed(2)} ADA
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">description:</span>
          <span className="text-zinc-500">{escrow.description}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">buyer:</span>
          <span className="text-zinc-400">
            {PARTY_ADDRESSES.alice.slice(0, 14)}...{PARTY_ADDRESSES.alice.slice(-6)}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">seller:</span>
          <span className="text-zinc-400">
            {escrow.recipientAddress.slice(0, 14)}...{escrow.recipientAddress.slice(-6)}
          </span>
        </div>
        <div className="flex gap-2 pt-2 border-t border-orange-800">
          <span className="text-orange-600 flex-shrink-0">reason:</span>
          <span className="text-orange-400">{escrow.disputeReason}</span>
        </div>
      </div>

      {!resolved ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={handlePaySeller}
            disabled={!isOpen || loading}
            className="w-full border border-green-800 text-green-300 rounded px-3 py-2 text-xs font-mono text-left
              hover:bg-green-950 transition-colors flex items-center gap-2
              disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent"
          >
            {loading ? <Spinner text="sending..." /> : "> pay seller (bob)"}
          </button>

          <button
            onClick={handleRefundBuyer}
            disabled={!isOpen || loading}
            className="w-full border border-blue-800 text-blue-300 rounded px-3 py-2 text-xs font-mono text-left
              hover:bg-blue-950 transition-colors flex items-center gap-2
              disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent"
          >
            {loading ? <Spinner text="sending..." /> : "> refund buyer (alice)"}
          </button>

          {!isOpen && (
            <p className="text-xs font-mono text-zinc-700">// head not open</p>
          )}
        </div>
      ) : (
        <div className={`border rounded bg-zinc-950 p-3 ${
          resolutionType === "paid" ? "border-green-900" : "border-blue-900"
        }`}>
          <p className={`text-xs font-mono mb-1 ${
            resolutionType === "paid" ? "text-green-400" : "text-blue-400"
          }`}>
            // resolved — {resolutionType === "paid" ? "payment sent to seller" : "refund sent to buyer"}
          </p>
        </div>
      )}
    </section>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <>
      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      {text}
    </>
  );
}
