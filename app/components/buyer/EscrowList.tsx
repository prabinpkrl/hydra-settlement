import { useState } from "react";

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
  onRelease: (dealId: string) => void;
  onCancel: (dealId: string) => void;
  onDispute: (dealId: string, reason: string) => void;
};

export function EscrowList({ escrows, isOpen, loading, onRelease, onCancel, onDispute }: Props) {
  if (escrows.length === 0) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs font-mono text-zinc-700">// no active escrows</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
        pending_escrows ({escrows.length})
      </p>
      {escrows.map((escrow) => (
        <EscrowCard
          key={escrow.dealId}
          escrow={escrow}
          isOpen={isOpen}
          loading={loading}
          onRelease={onRelease}
          onCancel={onCancel}
          onDispute={onDispute}
        />
      ))}
    </div>
  );
}

function EscrowCard({ escrow, isOpen, loading, onRelease, onCancel, onDispute }: {
  escrow: Escrow;
  isOpen: boolean;
  loading: boolean;
  onRelease: (dealId: string) => void;
  onCancel: (dealId: string) => void;
  onDispute: (dealId: string, reason: string) => void;
}) {
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const handleDispute = () => {
    if (disputeReason.trim().length < 10) return;
    onDispute(escrow.dealId, disputeReason);
    setShowDisputeForm(false);
    setDisputeReason("");
  };

  const statusColor = escrow.status === "PENDING" ? "border-blue-800 bg-blue-950/20"
    : escrow.status === "DISPUTED" ? "border-orange-800 bg-orange-950/20"
    : escrow.status === "COMPLETED" ? "border-green-800 bg-green-950/20"
    : "border-zinc-800 bg-zinc-900";

  const statusBadge = escrow.status === "PENDING" ? (
    <span className="text-xs font-mono text-blue-400 border border-blue-800 rounded px-2 py-0.5">PENDING</span>
  ) : escrow.status === "DISPUTED" ? (
    <span className="text-xs font-mono text-orange-400 border border-orange-800 rounded px-2 py-0.5">DISPUTED</span>
  ) : escrow.status === "COMPLETED" ? (
    <span className="text-xs font-mono text-green-400 border border-green-800 rounded px-2 py-0.5">COMPLETED</span>
  ) : null;

  return (
    <section className={`border rounded p-4 ${statusColor}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-400">{escrow.dealId}</p>
        {statusBadge}
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-3 flex flex-col gap-1.5 text-xs font-mono">
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">recipient:</span>
          <span className="text-zinc-400 break-all">
            {escrow.recipientAddress.slice(0, 14)}...{escrow.recipientAddress.slice(-6)}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">amount:</span>
          <span className="text-zinc-300 font-semibold">
            {(Number(escrow.amount) / 1_000_000).toFixed(2)} ADA
          </span>
        </div>
        {escrow.status === "PENDING" && (
          <div className="text-xs text-green-600 font-semibold">
            ⚡ Held on Layer 2 — instant & free
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">note:</span>
          <span className="text-zinc-500">{escrow.description}</span>
        </div>
        {escrow.status === "DISPUTED" && escrow.disputeReason && (
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <span className="text-orange-600 flex-shrink-0">dispute:</span>
            <span className="text-orange-400">{escrow.disputeReason}</span>
          </div>
        )}
      </div>

      {escrow.status === "PENDING" && (
        <>
          {!showDisputeForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => onRelease(escrow.dealId)}
                disabled={!isOpen || loading}
                className="flex-1 border border-green-800 text-green-300 rounded px-3 py-2 text-xs font-mono
                  hover:bg-green-950 transition-colors disabled:border-zinc-800 disabled:text-zinc-700 
                  disabled:cursor-not-allowed disabled:bg-transparent"
              >
                &gt; Confirm & Release
              </button>
              <button
                onClick={() => setShowDisputeForm(true)}
                disabled={!isOpen || loading}
                className="flex-1 border border-orange-800 text-orange-300 rounded px-3 py-2 text-xs font-mono
                  hover:bg-orange-950 transition-colors disabled:border-zinc-800 disabled:text-zinc-700 
                  disabled:cursor-not-allowed disabled:bg-transparent"
              >
                &gt; Report a Problem
              </button>
              <button
                onClick={() => onCancel(escrow.dealId)}
                disabled={loading}
                className="border border-zinc-700 text-zinc-500 rounded px-3 py-2 text-xs font-mono
                  hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the issue (min 10 characters)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-300
                  placeholder:text-zinc-700 focus:outline-none focus:border-orange-700"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDispute}
                  disabled={disputeReason.trim().length < 10}
                  className="flex-1 border border-orange-800 text-orange-300 rounded px-3 py-2 text-xs font-mono
                    hover:bg-orange-950 transition-colors disabled:border-zinc-800 disabled:text-zinc-700 
                    disabled:cursor-not-allowed disabled:bg-transparent"
                >
                  &gt; submit dispute
                </button>
                <button
                  onClick={() => {
                    setShowDisputeForm(false);
                    setDisputeReason("");
                  }}
                  className="border border-zinc-700 text-zinc-500 rounded px-3 py-2 text-xs font-mono
                    hover:bg-zinc-800 transition-colors"
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {escrow.status === "DISPUTED" && (
        <p className="text-xs font-mono text-orange-600">// waiting for mediator (carol) to resolve...</p>
      )}

      {!isOpen && (
        <p className="text-xs font-mono text-zinc-700">// head not open</p>
      )}
    </section>
  );
}
