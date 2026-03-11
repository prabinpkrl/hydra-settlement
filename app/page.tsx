"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const HYDRA_URL = "http://localhost:8082";

type CommitStatus = "idle" | "running" | "done" | "error";
type PartyCommitState = { status: CommitStatus; message: string };
const PARTIES_COMMIT = ["alice", "bob", "carol"] as const;
type CommitParty = typeof PARTIES_COMMIT[number];

type HeadTag = "Idle" | "Initial" | "Open" | "Closed" | "FanoutPossible" | "Final" | string;

function statusColor(tag: HeadTag) {
  if (tag === "Open") return "bg-green-500";
  if (tag === "Initial") return "bg-yellow-400";
  if (tag === "Idle") return "bg-gray-400";
  if (tag === "Closed" || tag === "Final") return "bg-red-400";
  return "bg-gray-300";
}

function statusLabel(tag: HeadTag) {
  if (tag === "...") return "Connecting...";
  return tag;
}

const parties = [
  { name: "Alice", role: "Sender", href: "/alice" },
  { name: "Bob", role: "Receiver", href: "/bob" },
  { name: "Carol", role: "Mediator", href: "/carol" },
];

export default function Home() {
  const [headTag, setHeadTag] = useState<HeadTag>("...");

  // General loading + status
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Commit state
  const [committing, setCommitting] = useState(false);
  const [commitStates, setCommitStates] = useState<Record<CommitParty, PartyCommitState>>({
    alice: { status: "idle", message: "" },
    bob:   { status: "idle", message: "" },
    carol: { status: "idle", message: "" },
  });

  function setPartyState(party: CommitParty, state: PartyCommitState) {
    setCommitStates(prev => ({ ...prev, [party]: state }));
  }

  async function initHead() {
    setLoading(true);
    setStatusMsg("Initializing head...");
    try {
      const res  = await fetch("/api/hydra/init", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStatusMsg("Head initialized. Now commit all parties.");
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function commitAll() {
    setLoading(true);
    setCommitting(true);
    setStatusMsg("Committing parties to head...");
    // Reset all to running
    setCommitStates({
      alice: { status: "running", message: "Committing..." },
      bob:   { status: "idle",    message: "" },
      carol: { status: "idle",    message: "" },
    });

    let failed = false;
    for (const party of PARTIES_COMMIT) {
      setPartyState(party, { status: "running", message: "Committing..." });
      try {
        const res  = await fetch("/api/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ party }),
        });
        const data = await res.json();
        if (data.ok) {
          setPartyState(party, { status: "done", message: `${party.charAt(0).toUpperCase() + party.slice(1)} committed` });
        } else {
          setPartyState(party, { status: "error", message: data.error ?? "Failed" });
          setStatusMsg(`Commit failed for ${party}: ${data.error ?? "Unknown error"}`);
          failed = true;
          break;
        }
      } catch (err: any) {
        setPartyState(party, { status: "error", message: err?.message ?? "Network error" });
        setStatusMsg(`Commit failed for ${party}: ${err?.message ?? "Network error"}`);
        failed = true;
        break;
      }
    }

    if (!failed) setStatusMsg("All parties committed. Head will open shortly.");
    setCommitting(false);
    setLoading(false);
  }

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${HYDRA_URL}/hydra/query/head`);
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        setHeadTag(data.tag ?? "Unknown");
      } catch {
        setHeadTag("Offline");
      }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hydra Escrow Devnet</h1>
        <p className="text-gray-500 mb-8 text-sm">3-party payment channel dashboard</p>

        {/* Head Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Head Status</span>
          <span className="flex items-center gap-2 ml-auto">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor(headTag)} ${headTag === "Open" ? "animate-pulse" : ""}`} />
            <span className="text-sm font-semibold text-gray-800">{statusLabel(headTag)}</span>
          </span>
        </div>

        {/* Party Cards */}
        <div className="flex flex-col gap-4">
          {parties.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="bg-white border border-gray-200 rounded-lg p-5 transition-colors flex items-center justify-between group hover:border-gray-300"
            >
              <div>
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-sm text-gray-500">{p.role}</div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-700 transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>

        {/* Head Setup */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-5">
          <div className="mb-4">
            <div className="font-semibold text-gray-900 text-sm mb-0.5">Head Setup</div>
            <div className="text-xs text-gray-500">Initialize the head, then commit all parties to open it.</div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={initHead}
              disabled={loading || headTag !== "Idle"}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Initialize Head
            </button>
            <button
              onClick={commitAll}
              disabled={loading || headTag !== "Initial"}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {committing ? "Committing..." : "Commit All Parties"}
            </button>
          </div>

          {statusMsg && (
            <p className="mt-3 text-xs text-gray-600">{statusMsg}</p>
          )}

          {/* Per-party commit status */}
          {PARTIES_COMMIT.some(p => commitStates[p].status !== "idle") && (
            <div className="mt-3 flex flex-col gap-2">
              {PARTIES_COMMIT.map(party => {
                const s = commitStates[party];
                if (s.status === "idle") return null;
                return (
                  <div key={party} className="flex items-center gap-2 text-sm">
                    {s.status === "running" && (
                      <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {s.status === "done" && (
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                    )}
                    {s.status === "error" && (
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                    )}
                    <span className={s.status === "error" ? "text-red-600" : "text-gray-700"}>
                      {s.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
