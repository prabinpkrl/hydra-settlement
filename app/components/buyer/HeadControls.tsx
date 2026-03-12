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
  if (tag === "Idle" || tag === "...")      return 0;
  if (tag === "Initial")                    return 1;
  if (tag === "Open")                       return 2;
  if (tag === "Closed" || tag === "FanoutPossible") return 3;
  if (tag === "Final")                      return 4;
  return 0;
}

const COMMIT_STATUS_COLOR: Record<string, string> = {
  idle:    "text-gray-400",
  running: "text-yellow-500",
  done:    "text-green-600",
  error:   "text-red-500",
};

const COMMIT_STATUS_ICON: Record<string, string> = {
  idle: "○", running: "◌", done: "✓", error: "✗",
};

export function HeadControls({
  headTag, loading, closing, fanouting,
  commitStates, statusMsg,
  onInit, onCommitAll, onClose, onFanout,
}: Props) {
  const step = activeStep(headTag);
  const busy = loading || closing || fanouting;
  const isFinal = headTag === "Final";

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Head Lifecycle
      </h2>

      <div className="flex flex-col gap-2">

        {/* ── Step 1: Initialize ── */}
        <Step
          index={0}
          currentStep={step}
          label="Initialize Head"
          doneLabel="Head initialized"
          isFinal={isFinal}
        >
          <button
            onClick={onInit}
            disabled={busy || step !== 0}
            className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && step === 0 ? <Spinner text="Initializing…" /> : "Initialize Head"}
          </button>
        </Step>

        {/* ── Step 2: Commit All ── */}
        <Step
          index={1}
          currentStep={step}
          label="Commit All Parties"
          doneLabel="All parties committed"
          isFinal={isFinal}
        >
          <button
            onClick={onCommitAll}
            disabled={busy || step !== 1}
            className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && step === 1 ? <Spinner text="Committing…" /> : "Commit All Parties"}
          </button>

          {/* per-party progress — only shown when on this step */}
          {step === 1 && Object.values(commitStates).some((s) => s.status !== "idle") && (
            <div className="flex flex-col gap-1 pl-1 mt-2">
              {Object.entries(commitStates).map(([party, s]) => (
                <div key={party} className="flex items-center gap-2 text-xs">
                  <span className={COMMIT_STATUS_COLOR[s.status]}>{COMMIT_STATUS_ICON[s.status]}</span>
                  <span className="capitalize text-gray-600">{party}</span>
                  {s.message && <span className="text-gray-400">— {s.message}</span>}
                </div>
              ))}
            </div>
          )}
        </Step>

        {/* ── Step 3: Close Head ── */}
        <Step
          index={2}
          currentStep={step}
          label="Close Head"
          doneLabel="Head closed"
          isFinal={isFinal}
        >
          <button
            onClick={onClose}
            disabled={busy || step !== 2}
            className="w-full bg-orange-500 text-white rounded-md py-2 text-sm font-medium hover:bg-orange-400 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {closing ? <Spinner text="Closing…" /> : "Close Head"}
          </button>
        </Step>

        {/* ── Step 4: Fanout ── */}
        <Step
          index={3}
          currentStep={step}
          label="Fanout to L1"
          doneLabel="Funds settled on L1"
          isFinal={isFinal}
        >
          <button
            onClick={onFanout}
            disabled={busy || step !== 3}
            className="w-full bg-emerald-600 text-white rounded-md py-2 text-sm font-medium hover:bg-emerald-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {fanouting ? <Spinner text="Fanning out…" /> : "Fanout to L1"}
          </button>
        </Step>

      </div>

      {statusMsg && (
        <p className="text-xs text-gray-500 text-center mt-3">{statusMsg}</p>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type StepProps = {
  index: number;
  currentStep: number;
  label: string;
  doneLabel: string;
  isFinal: boolean;
  children: React.ReactNode;
};

function Step({ index, currentStep, label, doneLabel, isFinal, children }: StepProps) {
  const isDone    = isFinal ? true : currentStep > index;
  const isActive  = currentStep === index;
  const isPending = currentStep < index;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isActive
          ? "border-gray-300 bg-gray-50"
          : isDone
          ? "border-green-100 bg-green-50"
          : "border-gray-100 bg-white opacity-60"
      }`}
    >
      {/* Step header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${
            isDone
              ? "bg-green-500 text-white"
              : isActive
              ? "bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {isDone ? "✓" : index + 1}
        </span>
        <span
          className={`text-xs font-semibold ${
            isDone ? "text-green-700" : isActive ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {isDone ? doneLabel : label}
        </span>
      </div>

      {/* Action — only shown when active */}
      {isActive && <div>{children}</div>}
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <>
      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {text}
    </>
  );
}
