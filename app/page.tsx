import Link from "next/link";

const PARTIES = [
  { role: "buyer",    name: "alice", desc: "locks funds · releases payment · raises disputes" },
  { role: "seller",   name: "bob",   desc: "confirms delivery · receives payment on release" },
  { role: "mediator", name: "carol", desc: "neutral arbiter · resolves disputes on-chain" },
];

const FLOW_STEPS = [
  { n: "01", text: "Buyer creates payment room — all members contribute funds to L2" },
  { n: "02", text: "Buyer protects payment with delivery description" },
  { n: "03", text: "Seller confirms delivery, confirms receipt" },
  { n: "04", text: "Buyer releases payment — or reports a problem" },
  { n: "05", text: "Dispute resolver settles: pay seller or refund buyer" },
  { n: "06", text: "Buyer closes payment room — funds returned to Cardano" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto py-16 px-6">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-6">
            cardano · hydra · l2
          </p>
          <h1 className="text-4xl font-mono font-bold text-zinc-100 mb-3 leading-tight tracking-tight">
            hydra_settlement
          </h1>
          <p className="font-mono text-sm text-zinc-500 mb-8 leading-relaxed">
            <span className="text-zinc-700">// </span>
            Protected 3-party payments on Cardano using Hydra.
            <br />
            <span className="text-zinc-700">// </span>
            Instant, secure, no fees — and settled on-chain.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 border border-zinc-700 text-zinc-300 px-5 py-2.5
              rounded font-mono text-sm hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            &gt; enter dashboard
          </Link>
        </div>

        {/* What is Hydra Head */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-5 mb-5">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">How It Works</p>
          <div className="font-mono text-xs text-zinc-500 leading-relaxed space-y-1">
            <p><span className="text-zinc-700">// </span>A payment room is a private channel where members transact instantly.</p>
            <p><span className="text-zinc-700">// </span>Funds are committed on-chain once, then move freely off-chain.</p>
            <p><span className="text-zinc-700">// </span>Final state settles back to Cardano when the room closes.</p>
          </div>
        </div>

        {/* Parties */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-5 mb-5">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">The Three Roles</p>
          <div className="flex flex-col gap-2">
            {PARTIES.map((p) => (
              <div key={p.role} className="flex gap-3 font-mono text-xs">
                <span className="text-zinc-700 w-16 flex-shrink-0">{p.role}</span>
                <span className="text-zinc-500">{p.name}</span>
                <span className="text-zinc-700 hidden sm:block">·</span>
                <span className="text-zinc-700 hidden sm:block">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow flow */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-5 mb-12">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">Payment Flow</p>
          <div className="flex flex-col gap-2">
            {FLOW_STEPS.map((s) => (
              <div key={s.n} className="flex gap-3 font-mono text-xs">
                <span className="text-zinc-700 flex-shrink-0">{s.n}</span>
                <span className="text-zinc-500">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-5 mb-5">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">access_interfaces</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/alice"
              className="border border-zinc-700 text-zinc-300 px-4 py-2.5 rounded font-mono text-sm
                hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
            >
              &gt; alice_buyer
            </Link>
            <Link
              href="/bob"
              className="border border-zinc-700 text-zinc-300 px-4 py-2.5 rounded font-mono text-sm
                hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
            >
              &gt; bob_seller
            </Link>
            <Link
              href="/carol"
              className="border border-zinc-700 text-zinc-300 px-4 py-2.5 rounded font-mono text-sm
                hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
            >
              &gt; carol_mediator
            </Link>
            <Link
              href="/explorer"
              className="border border-blue-700 text-blue-300 px-4 py-2.5 rounded font-mono text-sm
                hover:bg-blue-950 hover:text-blue-100 transition-colors text-left"
            >
              &gt; public_ledger
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 border border-zinc-600 text-zinc-500 px-8 py-3
              rounded font-mono text-xs hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
          >
            &gt; observer_dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}

