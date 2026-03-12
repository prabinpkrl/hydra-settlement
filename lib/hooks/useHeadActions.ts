import { useState } from "react";
import type { HeadTag, Party, CommitStatus, PartyCommitState } from "../types";

const PARTIES = ["alice", "bob", "carol"] as const;
const HYDRA_URL = "http://localhost:8082";
const POLL_MS = 3_000;
const TIMEOUT_MS = 300_000;

type CommitStates = Record<typeof PARTIES[number], PartyCommitState>;

const defaultCommitStates = (): CommitStates => ({
  alice: { status: "idle", message: "" },
  bob:   { status: "idle", message: "" },
  carol: { status: "idle", message: "" },
});

/**
 * Encapsulates all head lifecycle actions: init, commit-all, close, fanout.
 * UI components only call the returned handlers.
 */
export function useHeadActions(
  setHeadExternal?: (tag: HeadTag) => void,
  toast?: (msg: string, ok: boolean) => void
) {
  const [loading,       setLoading]       = useState(false);
  const [statusMsg,     setStatusMsg]     = useState("");
  const [commitStates,  setCommitStates]  = useState<CommitStates>(defaultCommitStates());
  const [closing,       setClosing]       = useState(false);
  const [fanouting,     setFanouting]     = useState(false);

  function notify(msg: string, ok: boolean) {
    setStatusMsg(msg);
    toast?.(msg, ok);
  }

  function setParty(party: typeof PARTIES[number], state: PartyCommitState) {
    setCommitStates((prev) => ({ ...prev, [party]: state }));
  }

  /** Poll until headTag === targetState or timeout. */
  async function pollUntil(target: string): Promise<boolean> {
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      try {
        const res = await fetch(`${HYDRA_URL}/hydra/query/head`);
        if (res.ok) {
          const body = await res.json();
          const tag: HeadTag = body.tag ?? body.state ?? "";
          setHeadExternal?.(tag as HeadTag);
          if (tag === target) return true;
        }
      } catch { /* keep polling */ }
    }
    return false;
  }

  async function initHead() {
    setLoading(true);
    notify("Initializing head...", true);
    try {
      const res  = await fetch("/api/hydra/init", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notify("Head initialized — commit all parties to continue.", true);
    } catch (err: any) {
      notify(`Init failed: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  }

  async function commitAll() {
    setLoading(true);
    setCommitStates(defaultCommitStates());
    notify("Committing parties...", true);

    for (const party of PARTIES) {
      setParty(party, { status: "running", message: "Committing..." });
      try {
        const res  = await fetch("/api/commit", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ party }),
        });
        const data = await res.json();
        if (data.ok) {
          setParty(party, { status: "done", message: `${party} committed` });
        } else {
          setParty(party, { status: "error", message: data.error ?? "Failed" });
          notify(`Commit failed for ${party}`, false);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setParty(party, { status: "error", message: err?.message ?? "Network error" });
        notify(`Commit failed for ${party}`, false);
        setLoading(false);
        return;
      }
    }

    notify("All parties committed — waiting for Head to open...", true);
    const reached = await pollUntil("Open");
    notify(
      reached ? "Head is Open!" : "Timed out waiting for Open state.",
      reached
    );
    setLoading(false);
  }

  async function closeHead() {
    if (closing) return;
    setClosing(true);
    notify("Close submitted — waiting for FanoutPossible...", true);
    try {
      const res  = await fetch("/api/close", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { notify(data.error ?? "Close failed", false); return; }
      const reached = await pollUntil("FanoutPossible");
      notify(
        reached ? "Head closed! Fanout is now available." : "Timed out waiting for FanoutPossible.",
        reached
      );
    } catch (err: any) {
      notify(err?.message ?? "Network error", false);
    } finally {
      setClosing(false);
    }
  }

  async function fanoutHead() {
    if (fanouting) return;
    setFanouting(true);
    notify("Fanout submitted — waiting for Final...", true);
    try {
      const res  = await fetch("/api/fanout", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { notify(data.error ?? "Fanout failed", false); return; }
      const reached = await pollUntil("Final");
      notify(
        reached ? "Funds settled on L1." : "Timed out waiting for Final.",
        reached
      );
    } catch (err: any) {
      notify(err?.message ?? "Network error", false);
    } finally {
      setFanouting(false);
    }
  }

  return {
    loading, statusMsg, commitStates,
    closing, fanouting,
    initHead, commitAll, closeHead, fanoutHead,
  };
}
