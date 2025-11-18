import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            Simple pricing for serious clinicians.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            ER Simulator is still in development. Pricing below is our current
            target and may be adjusted based on early access feedback. You will
            always see pricing and terms before you’re charged.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-lg font-semibold text-slate-50">
                Monthly – ER Simulator Pro
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Ideal for individual clinicians who want unlimited practice.
              </p>
              <p className="mt-6 text-3xl font-bold text-emerald-400">
                $19.99
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / month
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• Unlimited AI-driven EM simulations</li>
                <li>• Voice-to-voice interaction with patient & nurse</li>
                <li>• Dynamic vitals monitor & debriefs</li>
                <li>• Access on desktop (mobile later)</li>
              </ul>
              <div className="mt-6">
                <button
                  className="w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  disabled
                >
                  Early access coming soon
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  Paddle will securely process payments for subscriptions and
                  receipts.
                </p>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-emerald-500/50 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-50">
                Annual – ER Simulator Pro
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Best value for dedicated EM clinicians and programs.
              </p>
              <p className="mt-6 text-3xl font-bold text-emerald-400">
                $199
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / year
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• Everything in Monthly</li>
                <li>• Priority access to new cases & features</li>
                <li>• Potential CME support in future iterations</li>
              </ul>
              <div className="mt-6">
                <button
                  className="w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  disabled
                >
                  Join annual early access list
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  No charges occur until we explicitly open paid access.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-2 text-xs text-slate-500">
            <p>
              Tjomsland LLC dba ER Simulator uses Paddle and app stores (Apple /
              Google) to securely process payments and manage taxes.
            </p>
            <p>
              By purchasing, you agree to our{" "}
              <Link href="/terms" className="text-emerald-400 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/refund"
                className="text-emerald-400 hover:underline"
              >
                Refund Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}