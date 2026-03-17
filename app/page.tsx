import Link from "next/link";

const PARTIES = [
  { role: "Buyer", name: "Alice", desc: "Locks funds, releases payment, raises disputes" },
  { role: "Seller", name: "Bob", desc: "Confirms delivery, receives payment on release" },
  { role: "Mediator", name: "Carol", desc: "Neutral arbiter, resolves disputes on-chain" },
];

const FLOW_STEPS = [
  { n: "1", text: "Buyer creates payment room — all members contribute funds to L2" },
  { n: "2", text: "Buyer protects payment with delivery description" },
  { n: "3", text: "Seller confirms delivery, confirms receipt" },
  { n: "4", text: "Buyer releases payment — or reports a problem" },
  { n: "5", text: "Mediator settles: pay seller or refund buyer" },
  { n: "6", text: "Buyer closes payment room — funds returned to Cardano" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto py-20 px-6">

        {/* Hero */}
        <div className="mb-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Built on Cardano Hydra
          </p>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Secure Payments on Layer 2
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Instant transactions. Zero fees. Settle back to Cardano when done.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Open App
          </Link>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-3 gap-6">
            {FLOW_STEPS.map((s) => (
              <div key={s.n} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-3">{s.n}</div>
                <p className="text-sm text-slate-700">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Three Roles</h2>
          <div className="grid grid-cols-3 gap-6">
            {PARTIES.map((p) => (
              <div key={p.role} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{p.name}</h3>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-3">{p.role}</p>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Get Started</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/alice" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Alice (Buyer)
            </Link>
            <Link href="/bob" className="border border-slate-200 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Bob (Seller)
            </Link>
            <Link href="/carol" className="border border-slate-200 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Carol (Mediator)
            </Link>
            <Link href="/explorer" className="border border-slate-200 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Public Ledger
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-12 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">Powered by Cardano Hydra Protocol</p>
        </div>
      </div>
    </main>
  );
}

