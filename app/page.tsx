import Link from "next/link";

const PARTIES = [
  { role: "buyer",    name: "alice", desc: "locks funds · releases payment · raises disputes" },
  { role: "seller",   name: "bob",   desc: "confirms delivery · receives payment on release" },
  { role: "mediator", name: "carol", desc: "neutral arbiter · resolves disputes on-chain" },
];

const FLOW_STEPS = [
  { n: "01", text: "buyer initializes hydra head — all parties commit funds to L2" },
  { n: "02", text: "buyer locks ADA in escrow with a description" },
  { n: "03", text: "seller provides goods/services, confirms delivery" },
  { n: "04", text: "buyer releases payment — or raises a dispute" },
  { n: "05", text: "mediator resolves dispute: pay seller or refund buyer" },
  { n: "06", text: "buyer closes head — final state fanned out back to L1" },
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
            3-party off-chain escrow on cardano hydra.
            <br />
            <span className="text-zinc-700">// </span>
            near-zero fees · instant finality · l1 secured.
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
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">what_is_hydra</p>
          <div className="font-mono text-xs text-zinc-500 leading-relaxed space-y-1">
            <p><span className="text-zinc-700">// </span>a hydra head is a layer-2 isomorphic state channel on cardano.</p>
            <p><span className="text-zinc-700">// </span>participants lock funds on-chain (l1), transact freely off-chain (l2).</p>
            <p><span className="text-zinc-700">// </span>no fees · full speed · final state settled back to l1 via fanout.</p>
          </div>
        </div>

        {/* Parties */}
        <div className="border border-zinc-800 rounded bg-zinc-900 p-5 mb-5">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">participants</p>
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
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">escrow_flow</p>
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

