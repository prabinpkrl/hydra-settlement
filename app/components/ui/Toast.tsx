type Props = {
  msg: string;
  ok: boolean;
};

export function Toast({ msg, ok }: Props) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-md ${
        ok
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"
      }`}
    >
      {msg}
    </div>
  );
}
