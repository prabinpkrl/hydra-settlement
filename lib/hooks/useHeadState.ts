import { useEffect, useState } from "react";
import type { HeadTag, Party } from "../types";
import { HYDRA_URLS } from "../types";
import { logHeadEvent } from "../tx-log-store";

const POLL_MS = 5_000;

/**
 * Polls the Hydra node for the current head state.
 * `party` determines which node URL to connect to.
 */
export function useHeadState(party: Party) {
  const [headTag, setHeadTag] = useState<HeadTag>("...");

  useEffect(() => {
    let prev: HeadTag = "...";

    async function poll() {
      try {
        const res = await fetch(`${HYDRA_URLS[party]}/hydra/query/head`);
        if (!res.ok) { setHeadTag("Offline"); return; }
        const body = await res.json();
        const tag: HeadTag = body.tag ?? "Unknown";
        setHeadTag(tag);

        // emit log events on transitions
        if (prev !== tag) {
          if (tag === "Open")           logHeadEvent("head_open",   party);
          if (tag === "Closed")         logHeadEvent("head_close",  party);
          if (tag === "Final")          logHeadEvent("head_fanout", party);
          prev = tag;
        }
      } catch {
        setHeadTag("Offline");
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [party]);

  return headTag;
}
