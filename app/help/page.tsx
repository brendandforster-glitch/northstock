const guides = [
  {
    title: "Create an Account",
    description: "Create a free NorthStock buyer or seller account.",
    href: "/help/create-account",
  },
  {
    title: "Create or Manage Company Profile",
    description: "Set up and maintain your public company profile.",
    href: "/help/company-profile",
  },
  {
    title: "Add Inventory",
    description: "Add individual commercial inventory listings.",
    href: "/help/add-inventory",
  },
  {
    title: "Bulk Upload Inventory",
    description:
      "Upload multiple listings using the NorthStock Excel template.",
    href: "/help/bulk-upload",
  },
  {
    title: "Listing Quote Requests",
    description:
      "Request a quote on a listing and manage seller enquiries.",
    href: "/help/quote-requests",
  },
  {
    title: "Download Inventory",
    description: "Export your current seller inventory to Excel.",
    href: "/help/download-inventory",
  },
  {
    title: "Post a Buyer Request",
    description: "Tell suppliers what your business needs at no cost.",
    href: "/help/post-buyer-request",
  },
  {
    title: "Respond to Buyer Requests",
    description:
      "Send a private supply proposal to a NorthStock buyer.",
    href: "/help/respond-to-buyer-request",
  },
  {
    title: "Manage Buyer Requests",
    description:
      "Review responses and manage the requests you have posted.",
    href: "/help/manage-buyer-requests",
  },
  {
    title: "Track Seller Responses",
    description: "Review buyer decisions on proposals you submitted.",
    href: "/help/track-seller-responses",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <a
          href="/"
          className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
        >
          ← Back to NorthStock
        </a>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
          <div className="bg-slate-950 p-8 text-white md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              Buyer and Seller Support
            </p>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              NorthStock Help Centre
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              Step-by-step guides for browsing, buying, selling,
              posting buyer requests, and managing commercial inventory
              on NorthStock.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <a
                  key={guide.href}
                  href={guide.href}
                  className="group rounded-2xl border border-slate-300 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50"
                >
                  <h2 className="text-xl font-extrabold transition group-hover:text-blue-700">
                    {guide.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {guide.description}
                  </p>

                  <p className="mt-6 font-bold text-slate-950">
                    View guide →
                  </p>
                </a>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-xl font-extrabold">
                Still need help?
              </h2>

              <p className="mt-2 text-slate-600">
                Email NorthStock and we’ll help you get set up or
                resolve an account, inventory, quote, or buyer-request
                issue.
              </p>

              <a
                href="mailto:info@northstock.ca"
                className="mt-5 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
