import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "How NorthStock collects, uses, and protects personal information." };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-12 text-slate-950">
      <article className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-sm md:p-12">
        <a href="/" className="font-bold text-blue-600">← Back to NorthStock</a>
        <h1 className="mt-8 text-4xl font-extrabold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated August 18, 2026</p>
        <div className="mt-8 space-y-7 leading-7 text-slate-700">
          <section><h2 className="text-xl font-bold text-slate-950">Information we collect</h2><p className="mt-2">NorthStock collects account information, company profile details, inventory listings, buyer requests, messages, saved searches, and basic technical information needed to operate and secure the marketplace.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">How we use information</h2><p className="mt-2">We use information to provide accounts and marketplace features, deliver requested notifications, prevent abuse, respond to support requests, improve NorthStock, and meet legal obligations.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Marketplace visibility</h2><p className="mt-2">Company profiles, public listings, and public buyer requests may be visible to other users. Personal email addresses are not displayed on public buyer requests. Information you choose to publish should not include sensitive personal data.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Service providers</h2><p className="mt-2">NorthStock uses service providers for hosting, authentication, databases, email delivery, and analytics. They process information only to provide those services under their own security and privacy commitments.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Retention and choices</h2><p className="mt-2">We retain information while your account is active and as reasonably needed for security, operations, dispute resolution, and legal requirements. You may manage email alerts in your account and request access, correction, or deletion by contacting us.</p></section>
          <section><h2 className="text-xl font-bold text-slate-950">Contact</h2><p className="mt-2">Questions or privacy requests can be sent to <a className="font-bold text-blue-600" href="mailto:info@northstock.ca">info@northstock.ca</a>.</p></section>
        </div>
      </article>
    </main>
  );
}
