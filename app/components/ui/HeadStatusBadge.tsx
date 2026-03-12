import type { HeadTag } from "@/lib/types";

function dotColor(tag: HeadTag) {
  if (tag === "Open")                       return "bg-green-500";
  if (tag === "Initial")                    return "bg-yellow-400";
  if (tag === "Idle")                       return "bg-gray-400";
  if (tag === "Closed" || tag === "Final")  return "bg-red-400";
  if (tag === "FanoutPossible")             return "bg-orange-400";
  return "bg-gray-300";
}

type Props = { tag: HeadTag };

export function HeadStatusBadge({ tag }: Props) {
  const isOpen = tag === "Open";
  return (
    <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor(tag)} ${isOpen ? "animate-pulse" : ""}`} />
      <span className="text-sm font-medium text-gray-700">{tag}</span>
    </span>
  );
}
