type HealthStats = {
  todaysListings: number;
  activeListings: number;
  quoteRequests: number;
  savedSearches: number;
  companies?: number;
  users?: number;
  alertsSent?: number;
  newsletterSubscribers?: number;
};

export default function MarketplaceHealth({
  stats,
}: {
  stats: HealthStats;
}) {
  const healthLabel =
    stats.activeListings > 0 && stats.quoteRequests > 0
      ? "Growing"
      : stats.activeListings > 0
      ? "Inventory Building"
      : "Needs Inventory";

  return (
    <div className="mt-10 rounded-3xl border border-slate-300 bg-slate-950 p-6 text-white shadow-sm">
      <h2 className="text-2xl font-bold">Marketplace Health</h2>

      <p className="mt-2 text-slate-300">
        Quick read on NorthStock marketplace momentum.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-slate-300">Status</p>
          <h3 className="mt-2 text-3xl font-bold">🟢 {healthLabel}</h3>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-slate-300">Today's Listings</p>
          <h3 className="mt-2 text-3xl font-bold">{stats.todaysListings}</h3>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-slate-300">Quote Requests</p>
          <h3 className="mt-2 text-3xl font-bold">{stats.quoteRequests}</h3>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-slate-300">Saved Searches</p>
          <h3 className="mt-2 text-3xl font-bold">{stats.savedSearches}</h3>
        </div>
      </div>
    </div>
  );
}