type ExecutiveStats = {
  companies: number;
  users: number;
  activeListings: number;
  quoteRequests: number;
  savedSearches: number;
  alertsSent: number;
  newsletterSubscribers: number;
  todaysListings: number;
};

export default function ExecutiveOverview({
  stats,
}: {
  stats: ExecutiveStats;
}) {
  const cards = [
    { label: "Users", value: stats.users },
    { label: "Companies", value: stats.companies },
    { label: "Active Listings", value: stats.activeListings },
    { label: "Quote Requests", value: stats.quoteRequests },
    { label: "Saved Searches", value: stats.savedSearches },
    { label: "Alerts Sent", value: stats.alertsSent },
    { label: "Newsletter Subscribers", value: stats.newsletterSubscribers },
    { label: "Today's Listings", value: stats.todaysListings },
  ];

  return (
    <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">Executive Overview</h2>
        <p className="mt-2 text-slate-700">
          High-level snapshot of NorthStock marketplace activity.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <h3 className="mt-2 text-3xl font-bold">{card.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}