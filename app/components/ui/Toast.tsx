type Props = {
  msg: string;
  ok: boolean;
};

export function Toast({ msg, ok }: Props) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded px-4 py-2.5 text-xs font-mono tracking-wide shadow-xl border ${
        ok
          ? "bg-zinc-900 border-green-700 text-green-300"
          : "bg-zinc-900 border-red-700 text-red-300"
      }`}
    >
      <span className={ok ? "text-green-500" : "text-red-500"}>{'>'} </span>{msg}
    </div>
  );
}
