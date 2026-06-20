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
  const [authorized, setAuthorized] = useState(false);

  const [listingCount, setListingCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

    if (!allowedAdmins.includes(user.email || "")) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading admin...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold text-slate-950">Access denied</h1>
        <p className="mt-2 text-slate-700">
          You do not have permission to view this page.
        </p>

        <a
          href="/"
          className="mt-5 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          Return Home
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-slate-700">
              NorthStock marketplace overview and admin controls.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
          >
            Back to Home
          </a>
        </div>

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

        <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Admin Controls</h2>
          <p className="mt-2 text-slate-700">
            Manage sellers, listings, seller requests, and assisted inventory uploads.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/upload"
              className="rounded-2xl border border-slate-300 bg-slate-950 p-5 text-white shadow-sm hover:bg-slate-800"
            >
              <h3 className="text-lg font-bold">Upload For Seller</h3>
              <p className="mt-2 text-sm text-slate-300">
                Import Excel inventory into a selected seller account.
              </p>
            </a>

            <a
              href="/admin/sellers"
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500"
            >
              <h3 className="text-lg font-bold">Manage Sellers</h3>
              <p className="mt-2 text-sm text-slate-600">
                View company profiles and seller accounts.
              </p>
            </a>

            <a
              href="/admin/listings"
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500"
            >
              <h3 className="text-lg font-bold">Manage Listings</h3>
              <p className="mt-2 text-sm text-slate-600">
                Review, edit, renew, or delete marketplace listings.
              </p>
            </a>

            <a
              href="/admin/seller-requests"
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500"
            >
              <h3 className="text-lg font-bold">Seller Requests</h3>
              <p className="mt-2 text-sm text-slate-600">
                View companies requesting help uploading inventory.
              </p>
            </a>
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