import { create } from "zustand";

type EscrowStatus = "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";
type HeadProposalStatus = "pending" | "active";
type PartyName = "alice" | "bob" | "carol";

type EscrowStore = {
  status: EscrowStatus;
  dealId: string;        // unique deal identifier (e.g., ESC_a3f9b2) - for display only
  amount: string;        // in lovelace
  description: string;
  recipientAddress: string;
  disputeReason: string;
  txHash: string;
  setEscrow: (data: Partial<EscrowStore>) => void;
  resetEscrow: () => void;
  syncFromHead: (headId: string) => boolean;
};

// ── Deal ID generator ────────────────────────────────────────────────────────
export function generateDealId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ESC_${id}`;
}

// ── localStorage sync helpers (head-based) ───────────────────────────────────
const ESCROW_KEY_PREFIX = "hydra_escrow_";

export function saveEscrowToStorage(headId: string, escrow: Partial<EscrowStore>) {
  try {
    localStorage.setItem(ESCROW_KEY_PREFIX + headId, JSON.stringify({
      ...escrow,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error("Failed to save escrow to localStorage", e);
  }
}

export function loadEscrowFromStorage(headId: string): Partial<EscrowStore> | null {
  try {
    const data = localStorage.getItem(ESCROW_KEY_PREFIX + headId);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load escrow from localStorage", e);
    return null;
  }
}

export const useEscrowStore = create<EscrowStore>((set, get) => ({
  status: "IDLE",
  dealId: "",
  amount: "",
  description: "",
  recipientAddress: "",
  disputeReason: "",
  txHash: "",
  setEscrow: (data) => {
    set((state) => ({ ...state, ...data }));
  },
  resetEscrow: () => set({ 
    status: "IDLE",
    dealId: "",
    amount: "", 
    description: "", 
    recipientAddress: "", 
    disputeReason: "", 
    txHash: "" 
  }),
  syncFromHead: (headId: string) => {
    const escrow = loadEscrowFromStorage(headId);
    if (escrow) {
      set(escrow as EscrowStore);
      return true;
    }
    return false;
  },
}));

// ── Helper to save escrow with current headId ─────────────────────────────────
export function saveCurrentEscrow(headId: string, escrow: Partial<EscrowStore>) {
  if (headId) {
    saveEscrowToStorage(headId, escrow);
  }
}

// ── Head Coordination Store ──────────────────────────────────────────────────

type HeadProposal = {
  headId: string;
  status: HeadProposalStatus;
  participants: Record<PartyName, boolean>;
  createdBy: PartyName;
  timestamp: number;
};

type HeadProposalStore = {
  currentHeadId: string;
  proposal: HeadProposal | null;
  setProposal: (proposal: HeadProposal | null) => void;
  joinHead: (party: PartyName) => void;
  allJoined: () => boolean;
  markActive: () => void;
  reset: () => void;
  syncFromHead: (headId: string) => boolean;
};

// ── Head ID generator ────────────────────────────────────────────────────────
export function generateHeadId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HEAD_${id}`;
}

// ── localStorage sync for head proposals ─────────────────────────────────────
const HEAD_KEY_PREFIX = "hydra_head_";

export function saveHeadToStorage(headId: string, proposal: HeadProposal) {
  try {
    localStorage.setItem(HEAD_KEY_PREFIX + headId, JSON.stringify(proposal));
  } catch (e) {
    console.error("Failed to save head proposal to localStorage", e);
  }
}

export function loadHeadFromStorage(headId: string): HeadProposal | null {
  try {
    const data = localStorage.getItem(HEAD_KEY_PREFIX + headId);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load head proposal from localStorage", e);
    return null;
  }
}

export const useHeadProposalStore = create<HeadProposalStore>((set, get) => ({
  currentHeadId: "",
  proposal: null,
  setProposal: (proposal) => {
    set({ proposal, currentHeadId: proposal?.headId || "" });
    if (proposal) {
      saveHeadToStorage(proposal.headId, proposal);
    }
  },
  joinHead: (party) => {
    const { proposal } = get();
    if (!proposal) return;
    
    const updated = {
      ...proposal,
      participants: { ...proposal.participants, [party]: true },
    };
    set({ proposal: updated });
    saveHeadToStorage(proposal.headId, updated);
  },
  allJoined: () => {
    const { proposal } = get();
    if (!proposal) return false;
    return Object.values(proposal.participants).every((joined) => joined);
  },
  markActive: () => {
    const { proposal } = get();
    if (!proposal) return;
    
    const updated = { ...proposal, status: "active" as HeadProposalStatus };
    set({ proposal: updated });
    saveHeadToStorage(proposal.headId, updated);
  },
  reset: () => set({ currentHeadId: "", proposal: null }),
  syncFromHead: (headId: string) => {
    const proposal = loadHeadFromStorage(headId);
    if (proposal) {
      set({ proposal, currentHeadId: headId });
      return true;
    }
    return false;
  },
}));
