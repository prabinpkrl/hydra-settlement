import { useState } from "react";
import { PARTY_ADDRESSES } from "@/lib/types";
import {
  validateAmount,
  validateAddress,
  validateDescription,
  hasErrors,
  type ValidationError,
} from "@/lib/validation";

type Props = {
  isOpen: boolean;
  loading: boolean;
  balance?: number;  // in lovelace
  onLock: (recipient: string, lovelace: number, description: string) => void;
};

export function EscrowForm({ isOpen, loading, balance, onLock }: Props) {
  const [recipient,   setRecipient]   = useState(PARTY_ADDRESSES.bob);
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState({ recipient: false, amount: false, description: false });

  // Validation errors
  const errors = {
    recipient: touched.recipient ? validateAddress(recipient) : null,
    amount: touched.amount ? validateAmount(amount, balance) : null,
    description: touched.description ? validateDescription(description) : null,
  };

  const disabled =
    !isOpen ||
    !recipient ||
    !amount ||
    !description ||
    loading ||
    hasErrors(errors);

  function handleSubmit() {
    // Mark all as touched to show errors
    setTouched({ recipient: true, amount: true, description: true });

    // Revalidate
    if (validateAddress(recipient) || validateAmount(amount, balance) || validateDescription(description)) {
      return;
    }

    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (lovelace <= 0) return;
    onLock(recipient, lovelace, description);
  }

  return (
    <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Protected Payment</p>

      <div className="flex flex-col gap-3">
        <Field label="recipient" error={errors.recipient}>
          <TermInput
            value={recipient}
            onChange={(v) => { setRecipient(v); setTouched({ ...touched, recipient: true }); }}
            placeholder="addr_test1..."
            mono
            disabled={!isOpen || loading}
            error={!!errors.recipient}
          />
        </Field>
        <Field label="amount_ada" error={errors.amount}>
          <TermInput
            value={amount}
            onChange={(v) => { setAmount(v); setTouched({ ...touched, amount: true }); }}
            placeholder="0.00"
            type="number"
            disabled={!isOpen || loading}
            error={!!errors.amount}
          />
        </Field>
        <Field label="description" error={errors.description}>
          <TermInput
            value={description}
            onChange={(v) => { setDescription(v); setTouched({ ...touched, description: true }); }}
            placeholder="e.g. freelance payment..."
            disabled={!isOpen || loading}
            error={!!errors.description}
          />
        </Field>

        <TermBtn onClick={handleSubmit} disabled={disabled}>
          {loading ? <Spinner text="Protecting..." /> : "> Pay with Protection"}
        </TermBtn>

        {!isOpen && <p className="text-xs font-mono text-zinc-700">// Payment room not active</p>}
      </div>
    </section>
  );
}

function Field({ label, error, children }: {
  label: string;
  error: ValidationError;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-600 mb-1 block">{label}:</label>
      {children}
      {error && (
        <p className="text-xs font-mono text-red-400 mt-1">// {error}</p>
      )}
    </div>
  );
}

function TermInput({ value, onChange, placeholder, mono, type = "text", disabled, error }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200
        placeholder:text-zinc-700 focus:outline-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${error
          ? "border-2 border-red-700 focus:border-red-600"
          : "border border-zinc-700 focus:border-zinc-500"
        }`}
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
