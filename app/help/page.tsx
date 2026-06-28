const guides = [
  {
    title: "Create an Account",
    description: "Learn how to create a free NorthStock account.",
    href: "/help/create-account",
  },
  {
    title: "Create or Manage Company Profile",
    description: "Set up your public company profile.",
    href: "/help/company-profile",
  },
  {
    title: "Add Inventory",
    description: "Add individual listings to NorthStock.",
    href: "/help/add-inventory",
  },
  {
    title: "Bulk Upload Inventory",
    description: "Upload inventory using Excel.",
    href: "/help/bulk-upload",
  },
  {
    title: "Quote Requests",
    description: "Learn how buyers request quotes and sellers respond.",
    href: "/help/quote-requests",
  },
  {
    title: "Download Inventory",
    description: "Export your current inventory to Excel.",
    href: "/help/download-inventory",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <a href="/" className="text-sm font-bold text-slate-950">
          ← Back to NorthStock
        </a>

        <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold">NorthStock Help Centre</h1>
          <p className="mt-3 max-w-3xl text-slate-700">
            Step-by-step guides to help buyers and sellers use NorthStock.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <a
                key={guide.href}
                href={guide.href}
                className="rounded-2xl border border-slate-300 bg-slate-50 p-6 shadow-sm hover:border-slate-500"
              >
                <h2 className="text-xl font-bold">{guide.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {guide.description}
                </p>
                <p className="mt-5 font-semibold text-slate-950">
                  View guide →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}