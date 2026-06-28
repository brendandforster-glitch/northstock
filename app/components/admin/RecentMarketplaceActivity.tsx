type RecentCompany = {
  id: string;
  company_name: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
};

type RecentListing = {
  id: string;
  title: string | null;
  category: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
};

type RecentQuoteRequest = {
  id: string;
  buyer_email: string | null;
  listing_id: string | null;
  created_at: string | null;
};

type RecentData = {
  companies: RecentCompany[];
  listings: RecentListing[];
  quoteRequests: RecentQuoteRequest[];
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecentMarketplaceActivity({
  recent,
}: {
  recent: RecentData;
}) {
  return (
    <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Recent Marketplace Activity</h2>
      <p className="mt-2 text-slate-700">
        New companies, listings, and quote requests across NorthStock.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-bold">Newest Companies</h3>

          <div className="mt-4 space-y-3">
            {recent.companies.length > 0 ? (
              recent.companies.map((company) => (
                <a
                  key={company.id}
                  href={`/company/${company.id}`}
                  className="block rounded-xl bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <p className="font-semibold">
                    {company.company_name || "Unnamed Company"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {company.city || "Unknown city"}
                    {company.province ? `, ${company.province}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(company.created_at)}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-600">No companies yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-bold">Newest Listings</h3>

          <div className="mt-4 space-y-3">
            {recent.listings.length > 0 ? (
              recent.listings.map((listing) => (
                <a
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="block rounded-xl bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <p className="font-semibold">
                    {listing.title || "Untitled Listing"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {listing.category || "Uncategorized"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {listing.city || "Unknown city"}
                    {listing.province ? `, ${listing.province}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(listing.created_at)}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-600">No listings yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-bold">Newest Quote Requests</h3>

          <div className="mt-4 space-y-3">
            {recent.quoteRequests.length > 0 ? (
              recent.quoteRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold">
                    {request.buyer_email || "Buyer unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(request.created_at)}
                  </p>

                  {request.listing_id && (
                    <a
                      href={`/listings/${request.listing_id}`}
                      className="mt-2 inline-block text-sm font-bold text-blue-600 hover:underline"
                    >
                      View Listing →
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No quote requests yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}