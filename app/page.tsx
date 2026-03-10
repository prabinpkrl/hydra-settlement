"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const HYDRA_URL = "http://localhost:8082";

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
  { name: "Alice", role: "Sender", href: "/alice", color: "border-blue-200 hover:border-blue-400" },
  { name: "Bob", role: "Receiver", href: "/bob", color: "border-purple-200 hover:border-purple-400" },
  { name: "Carol", role: "Mediator", href: "/carol", color: "border-orange-200 hover:border-orange-400" },
];

export default function Home() {
  const [headTag, setHeadTag] = useState<HeadTag>("...");

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
              className={`bg-white border-2 ${p.color} rounded-lg p-5 transition-colors flex items-center justify-between group`}
            >
              <div>
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-sm text-gray-500">{p.role}</div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-700 transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
