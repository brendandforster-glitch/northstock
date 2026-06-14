"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  listing_id: string | null;
  buyer_email: string | null;
  created_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      const { count: listings } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true });

      const { count: companies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      const { count: leads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, listing_id, buyer_email, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      setListingCount(listings || 0);
      setCompanyCount(companies || 0);
      setLeadCount(leads || 0);
      setRecentLeads(leadsData || []);
      setLoading(false);
    }

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading admin...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-slate-700">NorthStock marketplace overview.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Listings</p>
            <h2 className="mt-2 text-3xl font-bold">{listingCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Companies</p>
            <h2 className="mt-2 text-3xl font-bold">{companyCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Quote Requests</p>
            <h2 className="mt-2 text-3xl font-bold">{leadCount}</h2>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Recent Quote Requests</h2>

          <div className="mt-5 space-y-3">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p>
                    <strong>Buyer:</strong>{" "}
                    {lead.buyer_email || "Not available"}
                  </p>

                  <p>
                    <strong>Listing ID:</strong>{" "}
                    {lead.listing_id || "Not available"}
                  </p>

                  <p>
                    <strong>Date:</strong> {formatDate(lead.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-700">No quote requests yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}