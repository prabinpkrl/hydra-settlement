"use client";

import { useState } from "react";
import { useHeadProposalStore, generateHeadId } from "@/lib/escrow-store";

type Props = {
  party: "alice" | "bob" | "carol";
  onHeadReady?: () => void;
};

export function HeadProposal({ party, onHeadReady }: Props) {
  const {
    proposal,
    setProposal,
    joinHead,
    allJoined,
    currentHeadId,
    syncFromHead,
  } = useHeadProposalStore();
  
  const [inputId, setInputId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Check if this party has already joined
  const hasJoined = proposal?.participants[party] || false;

  // Alice can create head proposal
  const handleCreateHead = () => {
    const headId = generateHeadId();
    const newProposal = {
      headId,
      status: "pending" as const,
      participants: {
        alice: party === "alice",
        bob: false,
        carol: false,
      },
      createdBy: "alice" as const,
      timestamp: Date.now(),
    };
    setProposal(newProposal);
    setError("");
  };

  // Any party can join with head ID
  const handleJoinHead = () => {
    const trimmed = inputId.trim().toUpperCase();
    
    if (!trimmed) {
      setError("enter a room ID");
      return;
    }
    
    if (!trimmed.startsWith("HEAD_")) {
      setError("invalid format (HEAD_xxxxxx)");
      return;
    }

    const found = syncFromHead(trimmed);
    if (!found) {
      setError("head proposal not found");
      return;
    }

    // Join the head
    joinHead(party);
    setError("");
    setInputId("");
  };

  // Copy head ID to clipboard
  const handleCopy = () => {
    if (!currentHeadId) return;
    navigator.clipboard.writeText(currentHeadId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if all parties have joined
  const readyToInit = allJoined();

  // If head is active, show nothing (parent will show normal controls)
  if (proposal?.status === "active") {
    return null;
  }

  // No proposal exists and this is Alice
  if (!proposal && party === "alice") {
    return (
      <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">head_coordination</p>
        
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono text-zinc-600">
            // create a head proposal to invite other parties
          </p>
          
          <button
            onClick={handleCreateHead}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-mono text-white transition-colors"
          >
            &gt; create head proposal
          </button>
        </div>
      </section>
    );
  }

  // No proposal exists and this is Bob/Carol - show join interface
  if (!proposal && party !== "alice") {
    return (
      <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">head_coordination</p>
        
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono text-zinc-600">
            // enter head proposal ID to join
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inputId}
              onChange={(e) => {
                setInputId(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="HEAD_xxxxxx"
              className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={handleJoinHead}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-mono text-white transition-colors"
            >
              join
            </button>
          </div>
          
          {error && (
            <p className="text-xs font-mono text-red-400">// {error}</p>
          )}
        </div>
      </section>
    );
  }

  // Proposal exists - show status and actions
  if (proposal) {
    return (
      <section className="border border-zinc-800 rounded bg-zinc-900 p-4 mb-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">head_coordination</p>
        
        <div className="flex flex-col gap-3">
          {/* Head ID display */}
          <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-600">head_id</span>
              <button
                onClick={handleCopy}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <p className="text-sm font-mono text-white break-all">{currentHeadId}</p>
          </div>

          {/* Participants status */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-mono text-zinc-600">// participants</p>
            {Object.entries(proposal.participants).map(([name, joined]) => (
              <div key={name} className="flex items-center gap-2 text-xs font-mono">
                <span className={joined ? "text-green-400" : "text-zinc-600"}>
                  {joined ? "[OK]" : "[ ]"}
                </span>
                <span className={joined ? "text-zinc-400" : "text-zinc-600"}>
                  {name}
                </span>
                {name === party && !joined && (
                  <span className="text-zinc-600">← you</span>
                )}
              </div>
            ))}
          </div>

          {/* Join button if not joined */}
          {!hasJoined && (
            <button
              onClick={() => joinHead(party)}
              className="px-4 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700/50 rounded text-xs font-mono text-indigo-400 transition-colors"
            >
              &gt; join head
            </button>
          )}

          {/* Ready to initialize message */}
          {readyToInit && (
            <div className="bg-green-950/20 border border-green-700/30 rounded p-3">
              <p className="text-xs font-mono text-green-400">
                All members ready — let's start!
              </p>
              {onHeadReady && (
                <button
                  onClick={onHeadReady}
                  className="mt-2 w-full px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700/50 rounded text-xs font-mono text-green-400 transition-colors"
                >
                  &gt; Create Payment Room
                </button>
              )}
            </div>
          )}

          {/* Waiting message */}
          {hasJoined && !readyToInit && (
            <p className="text-xs font-mono text-zinc-600">
              // Waiting for other members to join...
            </p>
          )}
        </div>
      </section>
    );
  }

  return null;
}
