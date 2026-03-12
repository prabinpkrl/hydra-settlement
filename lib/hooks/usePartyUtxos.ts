import { useEffect, useState } from "react";
import type { UtxoMap, Party } from "../types";
import { PARTY_ADDRESSES } from "../types";

const POLL_MS = 5_000;

/**
 * Polls the Hydra node and returns only the UTxOs belonging to `party`.
 */
export function usePartyUtxos(party: Party) {
  const [utxos,   setUtxos]   = useState<UtxoMap>({});
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = PARTY_ADDRESSES[party];

    async function poll() {
      try {
        const res = await fetch(`/api/hydra/query/utxo?party=${party}`);
        if (!res.ok) return;
        const all: UtxoMap = await res.json();
        const mine: UtxoMap = {};
        let total = 0;
        for (const [ref, u] of Object.entries(all)) {
          if (u.address === address) {
            mine[ref] = u;
            total += u.value?.lovelace ?? 0;
          }
        }
        setUtxos(mine);
        setBalance(total);
      } finally {
        setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [party]);

  return { utxos, balance, loading };
}
