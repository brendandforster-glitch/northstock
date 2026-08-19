import type { Metadata } from "next";

export const metadata: Metadata = { title: "Marketplace Guidelines" };

const rules = [
  "Describe inventory accurately, including quantity, condition, location, price, and material defects.",
  "Post only inventory you are authorized to sell and requests your business genuinely intends to source.",
  "Do not post illegal, stolen, counterfeit, recalled, dangerous, or rights-infringing goods.",
  "Communicate professionally and do not use NorthStock for spam, phishing, harassment, or deceptive outreach.",
  "Verify counterparties, inspect inventory, and agree on payment, taxes, shipping, and insurance independently.",
  "Mark sold, fulfilled, paused, or unavailable content promptly so the marketplace stays useful.",
  "Report suspicious activity to info@northstock.ca and do not send payment when identity or ownership is uncertain.",
];

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-12 text-slate-950">
      <article className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-sm md:p-12">
        <a href="/" className="font-bold text-blue-600">← Back to NorthStock</a>
        <p className="mt-8 text-sm font-extrabold uppercase tracking-widest text-blue-600">Trust and Safety</p>
        <h1 className="mt-3 text-4xl font-extrabold">Marketplace Guidelines</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">These guidelines help commercial buyers and sellers build reliable, direct business relationships.</p>
        <ol className="mt-8 space-y-4">
          {rules.map((rule, index) => <li key={rule} className="flex gap-4 rounded-2xl bg-slate-50 p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{index + 1}</span><span className="leading-7 text-slate-700">{rule}</span></li>)}
        </ol>
      </article>
    </main>
  );
}
