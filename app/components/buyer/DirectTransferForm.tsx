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
    if (hash) { setLastHash(hash); setRecipient(""); setAmount(""); }
  }

  return (
    <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">direct_transfer</p>

      <div className="flex flex-col gap-3">
        <Field label="to_address">
          <TermInput
            value={recipient}
            onChange={setRecipient}
            placeholder="addr_test1..."
            mono
            disabled={!isOpen || loading}
          />
        </Field>

        <Field label="amount_ada">
          <TermInput
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            type="number"
            disabled={!isOpen || loading}
          />
        </Field>

        <TermBtn onClick={handleSubmit} disabled={disabled} color="blue">
          {loading ? <Spinner text="sending..." /> : "> send"}
        </TermBtn>

        {!isOpen && <p className="text-xs font-mono text-zinc-700">// head not open</p>}

        {lastHash && (
          <div className="border border-green-900 rounded bg-zinc-950 p-3">
            <p className="text-xs font-mono text-green-500 mb-1">// transfer sent</p>
            <p className="font-mono text-xs text-zinc-500 break-all">{lastHash}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-600 mb-1 block">{label}:</label>
      {children}
    </div>
  );
}

function TermInput({ value, onChange, placeholder, mono, type = "text", disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  mono?: boolean; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200
        placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500
        disabled:opacity-40 disabled:cursor-not-allowed
        ${mono ? "font-mono" : "font-mono"}`}
    />
  );
}

const BTN_COLOR = {
  blue: "border-blue-800 text-blue-300 hover:bg-blue-950",
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
