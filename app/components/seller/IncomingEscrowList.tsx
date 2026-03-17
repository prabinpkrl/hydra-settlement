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
  myAddress: string;
};

export function IncomingEscrowList({ escrows, myAddress }: Props) {
  // Filter escrows addressed to this seller
  const incomingEscrows = escrows.filter(e => 
    e.recipientAddress === myAddress && 
    (e.status === "PENDING" || e.status === "DISPUTED")
  );

  if (incomingEscrows.length === 0) {
    return (
      <div className="border border-zinc-800 rounded bg-zinc-900 p-4">
        <p className="text-xs font-mono text-zinc-700">// No incoming payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
        Incoming Payments ({incomingEscrows.length})
      </p>
      {incomingEscrows.map((escrow) => (
        <IncomingEscrowCard key={escrow.dealId} escrow={escrow} />
      ))}
    </div>
  );
}

function IncomingEscrowCard({ escrow }: { escrow: Escrow }) {
  const [confirmed, setConfirmed] = useState(false);

  const statusColor = escrow.status === "PENDING" 
    ? "border-blue-800 bg-blue-950/20"
    : escrow.status === "DISPUTED" 
    ? "border-orange-800 bg-orange-950/20"
    : "border-green-800 bg-green-950/20";

  const statusBadge = escrow.status === "PENDING" ? (
    <span className="text-xs font-mono text-blue-400 border border-blue-800 rounded px-2 py-0.5">Awaiting Delivery</span>
  ) : escrow.status === "DISPUTED" ? (
    <span className="text-xs font-mono text-orange-400 border border-orange-800 rounded px-2 py-0.5">Under Review</span>
  ) : (
    <span className="text-xs font-mono text-green-400 border border-green-800 rounded px-2 py-0.5">Released ✅</span>
  );

  return (
    <section className={`border rounded p-4 ${statusColor}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-400">{escrow.dealId}</p>
        {statusBadge}
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-3 flex flex-col gap-1.5 text-xs font-mono">
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">Amount:</span>
          <span className="text-zinc-300 font-semibold">
            {(Number(escrow.amount) / 1_000_000).toFixed(2)} ADA
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-600 flex-shrink-0">Details:</span>
          <span className="text-zinc-500">{escrow.description}</span>
        </div>
        {escrow.status === "DISPUTED" && escrow.disputeReason && (
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <span className="text-orange-600 flex-shrink-0">Issue:</span>
            <span className="text-orange-400">{escrow.disputeReason}</span>
          </div>
        )}
      </div>

      {escrow.status === "PENDING" && !confirmed && (
        <div>
          <p className="text-xs font-mono text-zinc-500 mb-2">
            // Payment is protected. Confirm delivery to allow release.
          </p>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full border border-blue-800 text-blue-300 rounded px-3 py-2 text-xs font-mono
              hover:bg-blue-950 transition-colors"
          >
            &gt; Confirm Delivery
          </button>
        </div>
      )}

      {escrow.status === "PENDING" && confirmed && (
        <p className="text-xs font-mono text-green-600">
          // Delivery confirmed — waiting for buyer to release payment...
        </p>
      )}

      {escrow.status === "DISPUTED" && (
        <p className="text-xs font-mono text-orange-600">
          // Issue reported — dispute resolver is reviewing...
        </p>
      )}
    </section>
  );
}
