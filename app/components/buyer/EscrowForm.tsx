import { useState } from "react";
import { PARTY_ADDRESSES } from "@/lib/types";

type Props = {
  isOpen: boolean;
  loading: boolean;
  onLock: (recipient: string, lovelace: number, description: string) => void;
};

export function EscrowForm({ isOpen, loading, onLock }: Props) {
  const [recipient,   setRecipient]   = useState(PARTY_ADDRESSES.bob);
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");

  const disabled = !isOpen || !recipient || !amount || !description || loading;

  function handleSubmit() {
    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (lovelace <= 0) return;
    onLock(recipient, lovelace, description);
  }

  return (
    <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">new_escrow</p>

      <div className="flex flex-col gap-3">
        <Field label="recipient">
          <TermInput value={recipient} onChange={setRecipient} placeholder="addr_test1..." mono disabled={!isOpen || loading} />
        </Field>
        <Field label="amount_ada">
          <TermInput value={amount} onChange={setAmount} placeholder="0.00" type="number" disabled={!isOpen || loading} />
        </Field>
        <Field label="description">
          <TermInput value={description} onChange={setDescription} placeholder="e.g. freelance payment..." disabled={!isOpen || loading} />
        </Field>

        <TermBtn onClick={handleSubmit} disabled={disabled}>
          {loading ? <Spinner text="locking..." /> : "> lock funds"}
        </TermBtn>

        {!isOpen && <p className="text-xs font-mono text-zinc-700">// head not open</p>}
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
      className={`w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-200
        placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500
        disabled:opacity-40 disabled:cursor-not-allowed`}
    />
  );
}

function TermBtn({ children, onClick, disabled }: {
  children: React.ReactNode; onClick: () => void; disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full border border-amber-800 text-amber-300 rounded px-3 py-2 text-xs font-mono text-left
        hover:bg-amber-950 transition-colors flex items-center gap-2
        disabled:border-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:bg-transparent"
    >
      {children}
    </button>
  );
}

function Spinner({ text }: { text: string }) {
  return <><span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />{text}</>;
}
