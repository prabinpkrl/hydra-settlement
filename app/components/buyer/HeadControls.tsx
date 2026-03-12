import type { HeadTag, PartyCommitState } from "@/lib/types";

type Props = {
  headTag: HeadTag;
  loading: boolean;
  closing: boolean;
  fanouting: boolean;
  commitStates: Record<string, PartyCommitState>;
  statusMsg: string;
  onInit: () => void;
  onCommitAll: () => void;
  onClose: () => void;
  onFanout: () => void;
};

/** Which numbered lifecycle step is currently active (0-based). */
function activeStep(tag: HeadTag): number {
  if (tag === "Idle" || tag === "...")               return 0;
  if (tag === "Initial")                              return 1;
  if (tag === "Open")                                 return 2;
  if (tag === "Closed" || tag === "FanoutPossible")   return 3;
  if (tag === "Final")                                return 4;
  return 0;
}

const COMMIT_COLOR: Record<string, string> = {
  idle: "text-zinc-600", running: "text-amber-400", done: "text-green-400", error: "text-red-400",
};
const COMMIT_ICON: Record<string, string> = {
  idle: "○", running: "◌", done: "✓", error: "✗",
};

export function HeadControls({
  headTag, loading, closing, fanouting,
  commitStates, statusMsg,
  onInit, onCommitAll, onClose, onFanout,
}: Props) {
  const step    = activeStep(headTag);
  const busy    = loading || closing || fanouting;
  const isFinal = headTag === "Final";

  return (
    <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">head_lifecycle</p>

      <div className="flex flex-col gap-1.5">

        <Step index={0} current={step} label="init_head" doneLabel="head initialized" isFinal={isFinal}>
          <TermBtn onClick={onInit} disabled={busy || step !== 0} color="white">
            {loading && step === 0 ? <Spinner text="initializing..." /> : "> init head"}
          </TermBtn>
        </Step>

        <Step index={1} current={step} label="commit_all" doneLabel="all parties committed" isFinal={isFinal}>
          <TermBtn onClick={onCommitAll} disabled={busy || step !== 1} color="indigo">
            {loading && step === 1 ? <Spinner text="committing..." /> : "> commit all parties"}
          </TermBtn>
          {step === 1 && Object.values(commitStates).some((s) => s.status !== "idle") && (
            <div className="mt-2 flex flex-col gap-0.5 pl-2 border-l border-zinc-700">
              {Object.entries(commitStates).map(([party, s]) => (
                <div key={party} className="flex items-center gap-2 text-xs font-mono">
                  <span className={COMMIT_COLOR[s.status]}>{COMMIT_ICON[s.status]}</span>
                  <span className="text-zinc-500">{party}</span>
                  {s.message && <span className="text-zinc-600">— {s.message}</span>}
                </div>
              ))}
            </div>
          )}
        </Step>

        <Step index={2} current={step} label="close_head" doneLabel="head closed" isFinal={isFinal}>
          <TermBtn onClick={onClose} disabled={busy || step !== 2} color="amber">
            {closing ? <Spinner text="closing..." /> : "> close head"}
          </TermBtn>
        </Step>

        <Step index={3} current={step} label="fanout_l1" doneLabel="funds settled on L1" isFinal={isFinal}>
          <TermBtn onClick={onFanout} disabled={busy || step !== 3} color="green">
            {fanouting ? <Spinner text="fanning out..." /> : "> fanout to L1"}
          </TermBtn>
        </Step>

      </div>

      {statusMsg && (
        <p className="text-xs font-mono text-zinc-500 mt-3"><span className="text-zinc-700">//</span> {statusMsg}</p>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type StepProps = {
  index: number;
  current: number;
  label: string;
  doneLabel: string;
  isFinal: boolean;
  children: React.ReactNode;
};

function Step({ index, current, label, doneLabel, isFinal, children }: StepProps) {
  const isDone   = isFinal ? true : current > index;
  const isActive = current === index;

  return (
    <div className={`rounded p-2.5 border transition-colors ${
      isActive  ? "border-zinc-600 bg-zinc-800" :
      isDone    ? "border-zinc-800 bg-zinc-900" :
                  "border-zinc-800 bg-zinc-900 opacity-40"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-mono font-bold w-4 text-center ${
          isDone ? "text-green-400" : isActive ? "text-zinc-200" : "text-zinc-700"
        }`}>
          {isDone ? "✓" : `${index + 1}`}
        </span>
        <span className={`text-xs font-mono ${
          isDone ? "text-green-500" : isActive ? "text-zinc-200" : "text-zinc-600"
        }`}>
          {isDone ? doneLabel : label}
        </span>
      </div>
      {isActive && <div className="pl-6">{children}</div>}
    </div>
  );
}

const BTN_COLOR = {
  white:  "border-zinc-500 text-zinc-100 hover:bg-zinc-700",
  indigo: "border-indigo-700 text-indigo-300 hover:bg-indigo-950",
  amber:  "border-amber-700 text-amber-300 hover:bg-amber-950",
  green:  "border-green-700 text-green-300 hover:bg-green-950",
} as const;

function TermBtn({
  children, onClick, disabled, color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  color: keyof typeof BTN_COLOR;
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
  return (
    <>
      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      {text}
    </>
  );
}
