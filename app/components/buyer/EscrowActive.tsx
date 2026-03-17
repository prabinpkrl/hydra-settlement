import { useState } from "react";
import { validateDisputeReason } from "@/lib/validation";

type Props = {
  isOpen: boolean;
  loading: boolean;
  dealId: string;
  amount: string;
  description: string;
  recipient: string;
  txHash: string;
  onRelease: () => void;
  onCancel: () => void;
  onDispute: (reason: string) => void;
};

export function EscrowActive({
  isOpen, loading, dealId, amount, description,
  recipient, txHash, onRelease, onCancel, onDispute,
}: Props) {
  const [showDispute,   setShowDispute]   = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeTouched, setDisputeTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const disputeError = disputeTouched ? validateDisputeReason(disputeReason) : null;

  function submitDispute() {
    setDisputeTouched(true);
    const error = validateDisputeReason(disputeReason);
    if (error) return;
    
    onDispute(disputeReason.trim());
    setShowDispute(false);
    setDisputeReason("");
    setDisputeTouched(false);
  }

  function copyDealId() {
    navigator.clipboard.writeText(dealId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="border border-amber-900 rounded bg-zinc-900 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">escrow_active</p>
        <span className="text-xs font-mono text-amber-400 border border-amber-800 rounded px-2 py-0.5">AWAITING_DELIVERY</span>
      </div>

      {/* Deal ID - shareable */}
      <div className="border border-green-900 bg-green-950 rounded p-3 mb-3">
        <p className="text-xs font-mono text-green-400 mb-2">// share this deal ID with seller:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-green-300 tracking-wider">
            {dealId}
          </code>
          <button
            onClick={copyDealId}
            className="border border-green-800 text-green-300 rounded px-3 py-2 text-xs font-mono
              hover:bg-green-950 transition-colors flex-shrink-0"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-3 mb-4 flex flex-col gap-1.5 text-xs font-mono">
        <KV k="recipient" v={`${recipient.slice(0, 14)}...${recipient.slice(-6)}`} />
        <KV k="amount" v={`${(Number(amount) / 1_000_000).toFixed(2)} ADA`} highlight />
        <KV k="note" v={description} />
        <KV k="lock_tx" v={`${txHash.slice(0, 12)}...${txHash.slice(-6)}`} />
      </div>

      <div className="flex flex-col gap-2">
        <TermBtn onClick={onRelease} disabled={!isOpen || loading} color="green">
          {loading ? <Spinner text="Releasing..." /> : "> Confirm & Release"}
        </TermBtn>

        <TermBtn onClick={onCancel} disabled={loading} color="zinc">
          cancel
        </TermBtn>

        {!showDispute ? (
          <TermBtn onClick={() => setShowDispute(true)} disabled={loading} color="amber">
            Report a Problem
          </TermBtn>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-zinc-600">Problem details:</label>
            <textarea
              value={disputeReason}
              onChange={(e) => {
                setDisputeReason(e.target.value);
                setDisputeTouched(true);
              }}
              placeholder="Describe what went wrong..."
              rows={3}
              className={`w-full bg-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200
                placeholder:text-zinc-700 resize-none focus:outline-none
                ${disputeError
                  ? "border-2 border-red-700 focus:border-red-600"
                  : "border border-zinc-700 focus:border-zinc-500"
                }`}
            />
            {disputeError && (
              <p className="text-xs font-mono text-red-400">// {disputeError}</p>
            )}
            <div className="flex gap-2">
              <TermBtn onClick={submitDispute} disabled={!!disputeError || loading} color="amber">
               Submit Report
              </TermBtn>
              <TermBtn onClick={() => { setShowDispute(false); setDisputeReason(""); setDisputeTouched(false); }} disabled={false} color="zinc">
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
