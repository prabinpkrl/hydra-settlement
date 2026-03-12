// ── Head state ───────────────────────────────────────────────────────────────
export type HeadTag =
  | "..."
  | "Idle"
  | "Initial"
  | "Open"
  | "Closed"
  | "FanoutPossible"
  | "Final"
  | "Offline"
  | string;

// ── Parties ──────────────────────────────────────────────────────────────────
export type Party = "alice" | "bob" | "carol";

export const PARTY_ADDRESSES: Record<Party, string> = {
  alice: "addr_test1vqdf6gzqc4we0shgtnxxkyl5reshxx6gmcaujfdr7t9l34g204fe4",
  bob:   "addr_test1vrxlwk2m0n2yjxgdgrfvny5ewcr5feez9ykd3z4ukkj6cdcxh7v8k",
  carol: "addr_test1vrf9ksqwtvkyzgld4uh377prmzlsgyvmsvp9xe56tr3kk8g5g2z0x",
};

export const HYDRA_URLS: Record<Party, string> = {
  alice: "http://localhost:8082",
  bob:   "http://localhost:8083",
  carol: "http://localhost:8084",
};

// ── UTxO ─────────────────────────────────────────────────────────────────────
export type Utxo = {
  address: string;
  value: { lovelace: number };
};

export type UtxoMap = Record<string, Utxo>;

// ── Escrow ───────────────────────────────────────────────────────────────────
export type EscrowStatus = "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";

// ── Transaction event log ─────────────────────────────────────────────────────
export type TxEventKind =
  | "direct_send"
  | "escrow_lock"
  | "escrow_release"
  | "escrow_dispute"
  | "escrow_resolve_pay"
  | "escrow_resolve_refund"
  | "head_open"
  | "head_close"
  | "head_fanout";

export type TxEvent = {
  id: string;            // uuid-like (Date.now + random)
  kind: TxEventKind;
  party: Party;          // who triggered it
  timestamp: number;
  amount?: number;       // lovelace
  toAddress?: string;
  description?: string;
  txHash?: string;
  disputeReason?: string;
  /** Only for resolve events — who received the funds */
  resolvedFor?: Party;
};

// ── Commit state ─────────────────────────────────────────────────────────────
export type CommitStatus = "idle" | "running" | "done" | "error";

export type PartyCommitState = {
  status: CommitStatus;
  message: string;
};
