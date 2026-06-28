type GrowthStats = {
  companiesThisMonth: number;
  listingsThisMonth: number;
  quoteRequestsThisMonth: number;
};

export default function MarketplaceGrowth({
  growth,
}: {
  growth: GrowthStats;
}) {
  const cards = [
    { label: "Companies This Month", value: growth.companiesThisMonth },
    { label: "Listings This Month", value: growth.listingsThisMonth },
    { label: "Quote Requests This Month", value: growth.quoteRequestsThisMonth },
  ];

  return (
    <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Marketplace Growth</h2>
      <p className="mt-2 text-slate-700">
        Monthly activity across companies, listings, and buyer inquiries.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
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