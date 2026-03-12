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
    <section className="border border-amber-900 rounded bg-zinc-900 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">escrow_active</p>
        <span className="text-xs font-mono text-amber-400 border border-amber-800 rounded px-2 py-0.5">AWAITING_DELIVERY</span>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-4 flex flex-col gap-1.5 text-xs font-mono">
        <KV k="recipient" v={`${recipient.slice(0, 14)}...${recipient.slice(-6)}`} />
        <KV k="amount" v={`${(Number(amount) / 1_000_000).toFixed(2)} ADA`} highlight />
        <KV k="note" v={description} />
        <KV k="lock_tx" v={`${txHash.slice(0, 12)}...${txHash.slice(-6)}`} />
      </div>

      <div className="flex flex-col gap-2">
        <TermBtn onClick={onRelease} disabled={!isOpen || loading} color="green">
          {loading ? <Spinner text="releasing..." /> : "> release payment"}
        </TermBtn>

        <TermBtn onClick={onCancel} disabled={loading} color="zinc">
          cancel escrow
        </TermBtn>

        {!showDispute ? (
          <TermBtn onClick={() => setShowDispute(true)} disabled={loading} color="amber">
            raise dispute
          </TermBtn>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-zinc-600">dispute_reason:</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="describe the issue..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-200
                placeholder:text-zinc-700 resize-none focus:outline-none focus:border-zinc-500"
            />
            <div className="flex gap-2">
              <TermBtn onClick={submitDispute} disabled={!disputeReason.trim() || loading} color="amber">
               submit
              </TermBtn>
              <TermBtn onClick={() => { setShowDispute(false); setDisputeReason(""); }} disabled={false} color="zinc">
                cancel
              </TermBtn>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function KV({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-600 flex-shrink-0">{k}:</span>
      <span className={highlight ? "text-amber-300 font-semibold" : "text-zinc-400"}>{v}</span>
    </div>
  );
}

const BTN_COLOR = {
  green: "border-green-800 text-green-300 hover:bg-green-950",
  amber: "border-amber-800 text-amber-300 hover:bg-amber-950",
  zinc:  "border-zinc-700 text-zinc-400 hover:bg-zinc-800",
} as const;

function TermBtn({ children, onClick, disabled, color }: {
  children: React.ReactNode; onClick: () => void;
  disabled: boolean; color: keyof typeof BTN_COLOR;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 text-xs font-mono text-left transition-colors flex items-center gap-2
        ${BTN_COLOR[color]}
        disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent`}
    >
      {children}
    </button>
  );
}

function Spinner({ text }: { text: string }) {
  return <><span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />{text}</>;
}
