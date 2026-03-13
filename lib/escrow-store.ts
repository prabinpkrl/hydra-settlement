import { create } from "zustand";

// ── BroadcastChannel for cross-tab communication ───────────────────────────
let escrowChannel: BroadcastChannel | null = null;
let headChannel: BroadcastChannel | null = null;

function getEscrowChannel() {
  if (typeof window !== "undefined" && !escrowChannel) {
    try {
      escrowChannel = new BroadcastChannel("escrow-store");
    } catch (e) {
      // BroadcastChannel not supported
    }
  }
  return escrowChannel;
}

function getHeadChannel() {
  if (typeof window !== "undefined" && !headChannel) {
    try {
      headChannel = new BroadcastChannel("head-proposal-store");
    } catch (e) {
      // BroadcastChannel not supported
    }
  }
  return headChannel;
}

type EscrowStatus = "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";
type HeadProposalStatus = "pending" | "active";
type PartyName = "alice" | "bob" | "carol";

type Escrow = {
  dealId: string;        // unique deal identifier (e.g., ESC_a3f9b2)
  status: EscrowStatus;
  amount: string;        // in lovelace
  description: string;
  recipientAddress: string;
  disputeReason: string;
  txHash: string;
  createdAt: number;
};

type EscrowStore = {
  escrows: Escrow[];
  currentHeadId?: string;
  addEscrow: (escrow: Omit<Escrow, "createdAt">) => void;
  updateEscrow: (dealId: string, data: Partial<Escrow>) => void;
  removeEscrow: (dealId: string) => void;
  getEscrow: (dealId: string) => Escrow | undefined;
  getPendingEscrows: () => Escrow[];
  syncFromHead: (headId: string) => boolean;
  setCurrentHeadId: (headId: string) => void;
  
  // Backward compatibility - get most recent escrow
  status: EscrowStatus;
  dealId: string;
  amount: string;
  description: string;
  recipientAddress: string;
  disputeReason: string;
  txHash: string;
  setEscrow: (data: Partial<Escrow>) => void;
  resetEscrow: () => void;
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
const ESCROW_KEY_PREFIX = "hydra_escrows_";

export function saveEscrowsToStorage(headId: string, escrows: Escrow[]) {
  try {
    localStorage.setItem(ESCROW_KEY_PREFIX + headId, JSON.stringify({
      escrows,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error("Failed to save escrows to localStorage", e);
  }
}

export function loadEscrowsFromStorage(headId: string): Escrow[] {
  try {
    const data = localStorage.getItem(ESCROW_KEY_PREFIX + headId);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.escrows || [];
  } catch (e) {
    console.error("Failed to load escrows from localStorage", e);
    return [];
  }
}

export const useEscrowStore = create<EscrowStore>((set, get) => ({
  escrows: [],
  currentHeadId: "",
  
  setCurrentHeadId: (headId: string) => {
    set({ currentHeadId: headId });
  },
  
  // Backward compatibility getters - return most recent pending/active escrow
  get status() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.status || "IDLE";
  },
  get dealId() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.dealId || "";
  },
  get amount() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.amount || "";
  },
  get description() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.description || "";
  },
  get recipientAddress() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.recipientAddress || "";
  },
  get disputeReason() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.disputeReason || "";
  },
  get txHash() {
    const escrows = get().escrows;
    const active = escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    return active?.txHash || "";
  },
  
  addEscrow: (escrow) => {
    const newEscrow = { ...escrow, createdAt: Date.now() };
    set((state) => {
      const updated = { ...state, escrows: [...state.escrows, newEscrow] };
      // Auto-save to localStorage for cross-tab sync
      if (state.currentHeadId) {
        saveEscrowsToStorage(state.currentHeadId, updated.escrows);
      }
      // Broadcast to other tabs
      const channel = getEscrowChannel();
      if (channel) {
        try {
          channel.postMessage({ 
            type: "update", 
            escrows: updated.escrows,
            headId: state.currentHeadId 
          });
        } catch (err) {
          console.error("Failed to broadcast escrow update:", err);
        }
      }
      return updated;
    });
  },
  
  updateEscrow: (dealId, data) => {
    set((state) => {
      const updated = {
        ...state,
        escrows: state.escrows.map((e) =>
          e.dealId === dealId ? { ...e, ...data } : e
        ),
      };
      // Auto-save to localStorage for cross-tab sync
      if (state.currentHeadId) {
        saveEscrowsToStorage(state.currentHeadId, updated.escrows);
      }
      // Broadcast to other tabs
      const channel = getEscrowChannel();
      if (channel) {
        try {
          channel.postMessage({ 
            type: "update", 
            escrows: updated.escrows,
            headId: state.currentHeadId 
          });
        } catch (err) {
          console.error("Failed to broadcast escrow update:", err);
        }
      }
      return updated;
    });
  },
  
  removeEscrow: (dealId) => {
    set((state) => {
      const updated = {
        ...state,
        escrows: state.escrows.filter((e) => e.dealId !== dealId),
      };
      // Auto-save to localStorage for cross-tab sync
      if (state.currentHeadId) {
        saveEscrowsToStorage(state.currentHeadId, updated.escrows);
      }
      // Broadcast to other tabs
      const channel = getEscrowChannel();
      if (channel) {
        try {
          channel.postMessage({ 
            type: "update", 
            escrows: updated.escrows,
            headId: state.currentHeadId 
          });
        } catch (err) {
          console.error("Failed to broadcast escrow update:", err);
        }
      }
      return updated;
    });
  },
  
  getEscrow: (dealId) => {
    return get().escrows.find((e) => e.dealId === dealId);
  },
  
  getPendingEscrows: () => {
    return get().escrows.filter((e) => e.status === "PENDING" || e.status === "DISPUTED");
  },
  
  setEscrow: (data) => {
    // Backward compatibility - updates the most recent active escrow or creates new one
    const state = get();
    const active = state.escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    
    if (active && data.dealId === active.dealId) {
      state.updateEscrow(active.dealId, data);
    } else if (data.dealId && data.status) {
      // New escrow
      state.addEscrow(data as Omit<Escrow, "createdAt">);
    }
  },
  
  resetEscrow: () => {
    // Backward compatibility - removes most recent active escrow
    const state = get();
    const active = state.escrows.find(e => e.status === "PENDING" || e.status === "DISPUTED");
    if (active) {
      state.removeEscrow(active.dealId);
    }
  },
  
  syncFromHead: (headId: string) => {
    const escrows = loadEscrowsFromStorage(headId);
    if (escrows.length > 0) {
      set({ escrows, currentHeadId: headId });
      return true;
    }
    return false;
  },
}));

// ── Cross-tab synchronization for escrow store ────────────────────────────────
if (typeof window !== "undefined") {
  const channel = getEscrowChannel();
  if (channel) {
    channel.onmessage = (e) => {
      if (e.data?.type === "update" && e.data?.escrows) {
        useEscrowStore.setState({ 
          escrows: e.data.escrows,
          ...(e.data.headId && { currentHeadId: e.data.headId })
        });
      }
    };
  }
}

// ── Helper to save escrows with current headId ─────────────────────────────────
export function saveCurrentEscrows(headId: string, escrows: Escrow[]) {
  if (headId) {
    saveEscrowsToStorage(headId, escrows);
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
    const updated = { proposal, currentHeadId: proposal?.headId || "" };
    set(updated);
    if (proposal) {
      saveHeadToStorage(proposal.headId, proposal);
      // Broadcast to other tabs
      const channel = getHeadChannel();
      if (channel) {
        try {
          channel.postMessage({ type: "update", proposal });
        } catch (err) {
          console.error("Failed to broadcast head proposal update:", err);
        }
      }
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
    // Broadcast to other tabs
    const channel = getHeadChannel();
    if (channel) {
      try {
        channel.postMessage({ type: "update", proposal: updated });
      } catch (err) {
        console.error("Failed to broadcast head proposal update:", err);
      }
    }
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
    // Broadcast to other tabs
    const channel = getHeadChannel();
    if (channel) {
      try {
        channel.postMessage({ type: "update", proposal: updated });
      } catch (err) {
        console.error("Failed to broadcast head proposal update:", err);
      }
    }
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

// ── Cross-tab synchronization for head proposal store ─────────────────────────
if (typeof window !== "undefined") {
  const channel = getHeadChannel();
  if (channel) {
    channel.onmessage = (e) => {
      if (e.data?.type === "update" && e.data?.proposal) {
        useHeadProposalStore.setState({
          proposal: e.data.proposal,
          currentHeadId: e.data.proposal.headId,
        });
      }
    };
  }
}
