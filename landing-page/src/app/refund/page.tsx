import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16 text-sm text-slate-200">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Refund Policy
          </h1>
          <p className="mt-3 text-xs text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <p className="mt-6 text-sm text-slate-300">
            ER Simulator is provided by{" "}
            <strong>Tjomsland LLC dba ER Simulator</strong>. We want all users
            to feel confident in their purchase. This Refund Policy explains how
            refunds are handled for purchases made through our website.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            1. Unconditional Refund Guarantee
          </h2>
          <p className="mt-2">
            We offer a full, unconditional refund within 30 days of purchase. 
            If you are not satisfied for any reason, you may request a refund 
            and we will return the full purchase amount — no questions asked.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            2. How refunds are processed
          </h2>
          <p className="mt-2">
            Purchases made through Paddle (our payment provider and Merchant of 
            Record) will have refunds processed directly through Paddle. All 
            refunds are issued back to the original payment method.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            3. How to request a refund
          </h2>
          <p className="mt-2">
            To request a refund at any time within 30 days of purchase, email us at{" "}
            <a
              href="mailto:support@ersimulator.com"
              className="text-emerald-400 hover:underline"
            >
              support@ersimulator.com
            </a>
            .
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>The email address used at checkout</li>
            <li>The date of your purchase</li>
          </ul>

          <p className="mt-4">
            Refunds are typically processed within 3–7 business days after the request.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}