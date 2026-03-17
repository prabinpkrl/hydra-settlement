"use client";

import { useHeadState } from "@/lib/hooks/useHeadState";
import Link from "next/link";

export function Navbar() {
  const headTag = useHeadState("alice");

  const getStatusColor = (tag: string) => {
    switch (tag) {
      case "Open":
        return "bg-green-500";
      case "Initial":
        return "bg-yellow-500";
      case "Idle":
        return "bg-slate-400";
      case "Closed":
        return "bg-orange-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <nav className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: App Name */}
        <div className="text-xl font-bold text-[#1e293b] tracking-tight">
          HydraEscrow
        </div>

        {/* Right: Status Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#e2e8f0] bg-slate-50">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(headTag)}`}></span>
          <span className="text-xs font-medium text-[#64748b]">
            Layer 2: {headTag}
          </span>
        </div>
      </div>
    </nav>
  );
}
