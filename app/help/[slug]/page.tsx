import { notFound } from "next/navigation";

const guides: Record<
  string,
  {
    title: string;
    intro: string;
    steps: string[];
  }
> = {
  "create-account": {
    title: "Create an Account",
    intro:
      "Create a free NorthStock account to browse inventory, save listings, request quotes, and manage seller tools.",
    steps: [
      "Go to NorthStock.ca and click Create Free Account.",
      "Enter your email and create a password.",
      "Confirm your email if prompted.",
      "Log in to access listings, saved searches, saved listings, and seller tools.",
    ],
  },
  "company-profile": {
    title: "Create or Manage Your Company Profile",
    intro:
      "Your company profile helps buyers learn about your business and view your active inventory.",
    steps: [
      "Log in to your NorthStock account.",
      "Go to Seller Dashboard.",
      "Click Manage Company Profile.",
      "Add your company name, description, website, phone, city, province/state, and logo URL.",
      "Save your profile and view the public version.",
    ],
  },
  "add-inventory": {
    title: "Add Inventory",
    intro:
      "Add individual inventory listings so buyers can find and request quotes.",
    steps: [
      "Log in and go to Add / Bulk Upload Inventory.",
      "Enter the item title, category, quantity, condition, price, city, and details.",
      "Add brand, model, SKU, description, and image URL if available.",
      "Submit the listing.",
      "Confirm it appears on the public inventory page.",
    ],
  },
  "bulk-upload": {
    title: "Bulk Upload Inventory",
    intro:
      "Bulk upload allows sellers to add many listings using an Excel spreadsheet.",
    steps: [
      "Prepare your Excel inventory file.",
      "Include columns such as title, category, quantity, condition, price, city, province/state, brand, model, SKU, description, and image URL.",
      "Go to Add / Bulk Upload Inventory.",
      "Upload your Excel file.",
      "Review your listings after upload.",
    ],
  },
  "quote-requests": {
    title: "Quote Requests",
    intro:
      "Buyers can request quotes directly from sellers on individual listings.",
    steps: [
      "Buyers open a listing and click Request Quote.",
      "The buyer submits their contact details and message.",
      "The seller can view the request from Seller Dashboard → Quote Requests.",
      "The seller can email the buyer directly to continue the conversation.",
    ],
  },
  "download-inventory": {
    title: "Download Current Inventory",
    intro:
      "Sellers can export their current NorthStock inventory to Excel at any time.",
    steps: [
      "Log in to your seller account.",
      "Go to Seller Dashboard.",
      "Click Download Current Inventory.",
      "An Excel file will download with your current listings.",
      "Use this file as a backup or inventory reference.",
    ],
  },
};

export default async function HelpGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/help" className="text-sm font-bold text-slate-950">
          ← Back to Help Centre
        </a>

        <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold">{guide.title}</h1>

          <p className="mt-4 text-slate-700">{guide.intro}</p>

          <div className="mt-8 space-y-5">
            {guide.steps.map((step, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-sm font-bold text-slate-500">
                  Step {index + 1}
                </p>

                <p className="mt-2 text-slate-800">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-bold">Need help?</h2>

            <p className="mt-2 text-slate-300">
              Contact NorthStock and we'll be happy to help you get set up.
            </p>

            <a
              href="mailto:info@northstock.ca"
              className="mt-4 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}