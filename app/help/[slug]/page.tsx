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
      "Create a free NorthStock account to browse inventory, save listings and searches, request quotes, post buyer requests, and use seller tools.",
    steps: [
      "Go to NorthStock.ca and click Create Free Account.",
      "Enter your email address and create a secure password.",
      "Confirm your email address if prompted.",
      "Log in to access saved listings, saved searches, buyer requests, quote requests, and seller tools.",
      "NorthStock accounts are free for buyers and sellers, with no buyer fees, seller fees, listing fees, or commissions.",
    ],
  },

  "company-profile": {
    title: "Create or Manage Your Company Profile",
    intro:
      "Your company profile helps buyers learn about your business and view your active commercial inventory.",
    steps: [
      "Log in to your NorthStock account.",
      "Open Dashboard from the main navigation.",
      "Select Create Company Profile or Manage Company Profile.",
      "Add your company name, description, website, phone number, location, and logo URL.",
      "Save your changes and review the public version of your profile.",
    ],
  },

  "add-inventory": {
    title: "Add Inventory",
    intro:
      "Add individual commercial inventory listings so buyers can find your items and request quotes.",
    steps: [
      "Log in and select Sell Inventory from the main navigation.",
      "Enter the item title, category, quantity, condition, price or pricing note, city, and province/state.",
      "Add the brand, model, SKU, description, and image URL when available.",
      "Review the information and submit the listing.",
      "Confirm the new item appears in your seller dashboard and on the public inventory page.",
    ],
  },

  "bulk-upload": {
    title: "Bulk Upload Inventory",
    intro:
      "Bulk upload allows sellers to add multiple listings with NorthStock’s formatted Excel inventory template.",
    steps: [
      "Log in and select Sell Inventory from the main navigation.",
      "Download the latest NorthStock Excel template from the bulk-upload section.",
      "Enter one listing per row without changing the column headings.",
      "Use a current NorthStock category, such as Office Furniture, Restaurant Equipment, Hotel Supplies, or Commercial Gym Equipment.",
      "Complete the required listing fields and add optional brand, model, SKU, description, image URL, and pricing details when available.",
      "Upload the completed Excel file and review the import results.",
      "Check your seller dashboard to confirm the listings were added correctly.",
    ],
  },

  "quote-requests": {
    title: "Listing Quote Requests",
    intro:
      "A listing quote request lets a buyer contact the seller about one specific inventory listing.",
    steps: [
      "Open an inventory listing and select Request Quote.",
      "Enter the requested contact information and a message for the seller.",
      "Submit the quote request. NorthStock sends it to the seller associated with that listing.",
      "Sellers can review enquiries from Dashboard → Quote Requests.",
      "The buyer and seller can continue the conversation directly by email.",
      "For inventory that is not currently listed, use Buyer Requests instead.",
    ],
  },

  "download-inventory": {
    title: "Download Current Inventory",
    intro:
      "Sellers can export their current NorthStock inventory to a formatted Excel file at any time.",
    steps: [
      "Log in to your seller account.",
      "Open Dashboard from the main navigation.",
      "Select Download Current Inventory.",
      "NorthStock will create and download an Excel file containing your current listings.",
      "Use the file as a backup, inventory reference, or starting point for future updates.",
    ],
  },

  "post-buyer-request": {
    title: "Post a Buyer Request",
    intro:
      "Post what your business needs so NorthStock suppliers can send private supply proposals, even when the exact inventory is not currently listed.",
    steps: [
      "Log in to your free NorthStock account.",
      "Open Buyer Requests from the main navigation.",
      "Select Post a Buyer Request or Post What You Need.",
      "Enter a clear title, category, request details, quantity, budget, city, and province/state.",
      "Choose whether the request should be published publicly. Your personal email address is never displayed on the public request.",
      "Submit the request. It remains active for 30 days unless you pause, fulfil, or delete it.",
      "Posting a buyer request is free, with no buyer fees or commissions.",
    ],
  },

  "respond-to-buyer-request": {
    title: "Respond to a Buyer Request",
    intro:
      "Authenticated suppliers can privately respond when their business can provide the inventory a buyer needs.",
    steps: [
      "Log in to the NorthStock account connected to your seller company profile.",
      "Open Buyer Requests and select an active request that your business can fulfil.",
      "Select Respond to This Request.",
      "Review your company name and enter an optional price or quote and availability.",
      "Write a clear message describing the inventory, condition, location, delivery options, and other important details.",
      "Send the response. NorthStock saves it privately and emails the buyer when notification delivery is available.",
      "The buyer can reply to the notification email to contact your verified account email. NorthStock charges no response fee or commission.",
    ],
  },

  "manage-buyer-requests": {
    title: "Manage Buyer Requests and Responses",
    intro:
      "Use My Requests to review supplier responses and control the buyer requests your account has posted.",
    steps: [
      "Log in and select My Requests from the account section of the main navigation.",
      "Review each request’s status, expiry date, quantity, budget, and number of supplier responses.",
      "Open a request to review the full details or read the private supply proposals shown beneath it.",
      "Pause an active request when you temporarily do not want new responses, then resume it when ready.",
      "Mark the request fulfilled once your business has sourced the inventory.",
      "Reactivate an expired or fulfilled request for another 30 days when you still need proposals.",
      "Delete a request only when you no longer need it. Deleting also removes its associated supplier responses and cannot be undone.",
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
        <a
          href="/help"
          className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
        >
          ← Back to Help Centre
        </a>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
          <div className="bg-slate-950 p-8 text-white md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              NorthStock Guide
            </p>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              {guide.title}
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              {guide.intro}
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="space-y-5">
              {guide.steps.map((step, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-[56px_1fr] sm:items-start"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-extrabold text-white">
                    {index + 1}
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Step {index + 1}
                    </p>

                    <p className="mt-2 leading-7 text-slate-800">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
              <h2 className="text-xl font-extrabold">
                Need help?
              </h2>

              <p className="mt-2 text-slate-300">
                Contact NorthStock and we’ll be happy to help you get
                set up or resolve an issue.
              </p>

              <a
                href="mailto:info@northstock.ca"
                className="mt-4 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
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