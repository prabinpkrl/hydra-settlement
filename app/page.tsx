import Link from "next/link";

const FEATURES = [
  {
    title: "Buyer (Alice)",
    description: "Initiates escrow payments, locks funds, releases or disputes.",
  },
  {
    title: "Seller (Bob)",
    description: "Receives payments, confirms delivery to trigger fund release.",
  },
  {
    title: "Mediator (Carol)",
    description: "Neutral arbiter — pays seller or refunds buyer on disputes.",
  },
  {
    title: "Public Ledger",
    description: "Live feed of all activity across all parties, like a group view.",
  },
];

const FLOW_STEPS = [
  { step: "1", text: "Buyer initializes the Hydra Head and all parties commit." },
  { step: "2", text: "Buyer locks funds in escrow with a description." },
  { step: "3", text: "Seller confirms delivery once goods/services are provided." },
  { step: "4", text: "Buyer releases payment — or raises a dispute for mediation." },
  { step: "5", text: "Mediator resolves dispute: pays seller or refunds buyer." },
  { step: "6", text: "Buyer closes the head and fans out funds to L1." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-16 px-6">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 mb-5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-medium text-indigo-700">Cardano Hydra L2</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Hydra Settlement
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            A 3-party off-chain escrow system built on Cardano's Hydra Head protocol.
            Transact at near-zero fees with instant finality, secured by L1 settlement.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Open Dashboard
            <span className="text-base">→</span>
          </Link>
        </div>

        {/* What is Hydra Head */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">What is a Hydra Head?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            A Hydra Head is a Layer 2 isomorphic state channel on Cardano. Participants lock funds
            on-chain (L1), then transact freely off-chain (L2) at full speed with no fees.
            When done, the final state is settled back to L1 via a fanout transaction.
          </p>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Escrow flow */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Escrow Flow</h2>
          <div className="flex flex-col gap-3">
            {FLOW_STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                  {s.step}
                </span>
                <p className="text-sm text-gray-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Enter Dashboard
            <span className="text-base">→</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
