import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Getting Started",
  description: "Launch your NorthStock seller profile and inventory in a few simple steps.",
};

const steps = [
  { title: "Create your free account", text: "Use the business email you want buyers and NorthStock notifications to reach.", href: "/login", action: "Create account" },
  { title: "Build your company profile", text: "Add your company name, location, contact details, description, website, and logo.", href: "/company", action: "Manage profile" },
  { title: "Prepare your inventory", text: "Gather titles, categories, quantities, condition, location, pricing, brand, model, SKU, and image links.", href: "/help/add-inventory", action: "View listing guide" },
  { title: "List or bulk upload", text: "Add items individually or use the formatted Excel template for larger inventories.", href: "/list-inventory", action: "Add inventory" },
  { title: "Respond to demand", text: "Review listing enquiries and active buyer requests, then send accurate, timely proposals.", href: "/buyer-requests", action: "Browse buyer requests" },
  { title: "Keep listings current", text: "Mark sold items, renew active inventory, and remove unavailable products promptly.", href: "/seller", action: "Open dashboard" },
];

export default function SellerGettingStartedPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <a href="/" className="font-bold text-blue-600">← Back to NorthStock</a>
        <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-slate-950 p-8 text-white md:p-12">
            <p className="text-sm font-extrabold uppercase tracking-widest text-blue-300">Free Seller Onboarding</p>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Start selling on NorthStock</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Create a credible company presence, publish commercial inventory, and connect directly with buyers—without listing fees or commissions.</p>
          </div>
          <div className="grid gap-5 p-8 md:grid-cols-2 md:p-10">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border bg-slate-50 p-6">
                <p className="text-sm font-extrabold text-blue-600">STEP {index + 1}</p>
                <h2 className="mt-2 text-xl font-extrabold">{step.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                <a href={step.href} className="mt-5 inline-block font-bold text-slate-950">{step.action} →</a>
              </div>
            ))}
          </div>
          <div className="border-t bg-blue-50 p-8 md:p-10">
            <h2 className="text-2xl font-extrabold">Need help launching your inventory?</h2>
            <p className="mt-3 text-slate-600">Email <a className="font-bold text-blue-600" href="mailto:info@northstock.ca">info@northstock.ca</a> for onboarding support.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
