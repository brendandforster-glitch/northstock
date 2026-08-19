import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using the NorthStock commercial inventory marketplace." };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-12 text-slate-950">
      <article className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-sm md:p-12">
        <a href="/" className="font-bold text-blue-600">← Back to NorthStock</a>
        <h1 className="mt-8 text-4xl font-extrabold">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated August 18, 2026</p>
        <div className="mt-8 space-y-7 leading-7 text-slate-700">
          <section><h2 className="text-xl font-bold text-slate-950">Marketplace role</h2><p className="mt-2">NorthStock provides tools for commercial buyers and sellers to discover inventory and communicate. NorthStock is not the buyer, seller, broker, inspector, shipper, or payment processor in transactions arranged between users.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Accounts</h2><p className="mt-2">You must provide accurate information, keep your credentials secure, and use the service only for lawful business purposes. You are responsible for activity under your account.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Listings and requests</h2><p className="mt-2">Content must be accurate, current, and lawful. You must have authority to offer listed inventory or post a buyer request. Misleading, infringing, unsafe, prohibited, or fraudulent content may be removed and accounts may be suspended.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Transactions and due diligence</h2><p className="mt-2">Users are responsible for verifying identity, ownership, condition, pricing, taxes, shipping, insurance, payment terms, and legal compliance before completing any transaction. NorthStock does not guarantee inventory, users, responses, or transaction outcomes.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Fees and changes</h2><p className="mt-2">NorthStock currently offers free accounts, listings, buyer requests, and direct marketplace connections without commissions. If paid features are introduced, the applicable price and terms will be disclosed before purchase.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Availability and liability</h2><p className="mt-2">The service is provided on an “as available” basis. To the extent permitted by law, NorthStock is not liable for indirect losses or disputes arising from user content, third-party transactions, or service interruptions.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Contact</h2><p className="mt-2">Questions can be sent to <a className="font-bold text-blue-600" href="mailto:info@northstock.ca">info@northstock.ca</a>.</p></section>
        </div>
      </article>
    </main>
  );
}
