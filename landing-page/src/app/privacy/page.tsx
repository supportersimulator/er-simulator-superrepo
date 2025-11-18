import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16 text-sm text-slate-200">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Privacy Policy
          </h1>
          <p className="mt-3 text-xs text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <p className="mt-6 text-sm text-slate-300">
            This Privacy Policy explains how{" "}
            <strong>Tjomsland LLC dba ER Simulator</strong> (&quot;we&quot;,
            &quot;us&quot;, &quot;our&quot;) collects, uses, and protects your
            information when you use ER Simulator (the &quot;Service&quot;).
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            1. Information we collect
          </h2>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>
              <span className="font-semibold">Account information</span> such as
              your name, email address, and profession.
            </li>
            <li>
              <span className="font-semibold">Usage data</span> such as which
              cases you run, time spent, and general performance metrics.
            </li>
            <li>
              <span className="font-semibold">Payment information</span>{" "}
              processed securely by Paddle or app stores. We do not store your
              full card details on our servers.
            </li>
          </ul>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            2. How we use information
          </h2>
          <p className="mt-2">
            We use information to operate and improve the Service, personalize
            scenarios, communicate with you about updates, and comply with legal
            obligations.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            3. Sharing of information
          </h2>
          <p className="mt-2">
            We may share data with trusted service providers (such as hosting,
            analytics, payment processors, and customer support tools) who
            assist us in running the Service. They are required to protect your
            data and may not use it for their own purposes.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            4. Data retention
          </h2>
          <p className="mt-2">
            We retain data for as long as necessary to provide the Service and
            for legitimate business or legal purposes. You can request deletion
            of your account by contacting us.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            5. Security
          </h2>
          <p className="mt-2">
            We take reasonable measures to protect your information, but no
            system is completely secure. Please use strong passwords and do not
            share your login details.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            6. Children&apos;s privacy
          </h2>
          <p className="mt-2">
            The Service is intended for adults and is not directed to children
            under 18. We do not knowingly collect personal information from
            children.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            7. International users
          </h2>
          <p className="mt-2">
            If you access the Service from outside the United States, you
            understand that your information may be processed in the U.S. or
            other countries where our service providers are located.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            8. Changes to this policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. When we do, we
            will update the &quot;Last updated&quot; date above.
          </p>

          <h2 className="mt-4 text-base font-semibold text-slate-50">
            9. Contact
          </h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, contact us at{" "}
            <a
              href="mailto:support@ersimulator.com"
              className="text-emerald-400 hover:underline"
            >
              support@ersimulator.com
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}