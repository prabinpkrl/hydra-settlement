import { create } from "zustand";

type EscrowStatus = "IDLE" | "PENDING" | "DISPUTED" | "COMPLETED";

type EscrowStore = {
  status: EscrowStatus;
  amount: string;        // in lovelace
  description: string;
  recipientAddress: string;
  disputeReason: string;
  txHash: string;
  setEscrow: (data: Partial<EscrowStore>) => void;
  resetEscrow: () => void;
};

export const useEscrowStore = create<EscrowStore>((set) => ({
  status: "IDLE",
  amount: "",
  description: "",
  recipientAddress: "",
  disputeReason: "",
  txHash: "",
  setEscrow: (data) => set((state) => ({ ...state, ...data })),
  resetEscrow: () => set({ 
    status: "IDLE", 
    amount: "", 
    description: "", 
    recipientAddress: "", 
    disputeReason: "", 
    txHash: "" 
  }),
}));
