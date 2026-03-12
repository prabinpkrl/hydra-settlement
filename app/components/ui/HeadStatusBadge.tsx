import type { HeadTag } from "@/lib/types";

function dotColor(tag: HeadTag) {
  if (tag === "Open")                        return "bg-green-400";
  if (tag === "Initial")                     return "bg-amber-400";
  if (tag === "Idle")                        return "bg-zinc-500";
  if (tag === "Closed" || tag === "Final")   return "bg-red-500";
  if (tag === "FanoutPossible")              return "bg-orange-400";
  return "bg-zinc-600";
}

function tagColor(tag: HeadTag) {
  if (tag === "Open")            return "text-green-400";
  if (tag === "Initial")         return "text-amber-400";
  if (tag === "FanoutPossible")  return "text-orange-400";
  if (tag === "Final")           return "text-green-500";
  return "text-zinc-400";
}

type Props = { tag: HeadTag };

export function HeadStatusBadge({ tag }: Props) {
  const isOpen = tag === "Open";
  return (
    <span className="flex items-center gap-2 border border-zinc-700 rounded px-3 py-1 bg-zinc-900">
      <span className={`w-2 h-2 rounded-full ${dotColor(tag)} ${isOpen ? "animate-pulse" : ""}`} />
      <span className={`text-xs font-mono font-semibold tracking-widest uppercase ${tagColor(tag)}`}>{tag}</span>
    </span>
  );
}
