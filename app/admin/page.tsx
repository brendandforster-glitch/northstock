"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  listing_id: string | null;
  buyer_email: string | null;
  created_at: string | null;
  listing_title?: string;
  seller_company?: string;
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
  const [activeListingCount, setActiveListingCount] = useState(0);
  const [expiredListingCount, setExpiredListingCount] = useState(0);
  const [soldListingCount, setSoldListingCount] = useState(0);
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

    const now = new Date().toISOString();

    const { count: listings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true });

    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gt("expires_at", now);

    const { count: expiredListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .neq("status", "sold")
      .lt("expires_at", now);

    const { count: soldListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "sold");

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

    const enrichedLeads = await Promise.all(
      (leadsData || []).map(async (lead) => {
        if (!lead.listing_id) {
          return {
            ...lead,
            listing_title: "Listing unavailable",
            seller_company: "Unknown seller",
          };
        }

        const { data: listing } = await supabase
          .from("listings")
          .select("title, user_id")
          .eq("id", lead.listing_id)
          .maybeSingle();

        let sellerCompany = "Unknown seller";

        if (listing?.user_id) {
          const { data: company } = await supabase
            .from("companies")
            .select("company_name")
            .eq("user_id", listing.user_id)
            .maybeSingle();

          sellerCompany = company?.company_name || "Unknown seller";
        }

        return {
          ...lead,
          listing_title: listing?.title || "Listing unavailable",
          seller_company: sellerCompany,
        };
      })
    );

    setListingCount(listings || 0);
    setActiveListingCount(activeListings || 0);
    setExpiredListingCount(expiredListings || 0);
    setSoldListingCount(soldListings || 0);
    setCompanyCount(companies || 0);
    setLeadCount(leads || 0);
    setRecentLeads(enrichedLeads as Lead[]);
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

        <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Listings</p>
            <h2 className="mt-2 text-3xl font-bold">{listingCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {activeListingCount}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Expired</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {expiredListingCount}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Sold</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {soldListingCount}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Companies</p>
            <h2 className="mt-2 text-3xl font-bold">{companyCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Quote Requests</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {leadCount}
            </h2>
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
                    <strong>Listing:</strong>{" "}
                    {lead.listing_title || "Listing unavailable"}
                  </p>

                  <p>
                    <strong>Seller:</strong>{" "}
                    {lead.seller_company || "Unknown seller"}
                  </p>

                  <p>
                    <strong>Date:</strong> {formatDate(lead.created_at)}
                  </p>

                  {lead.listing_id && (
                    <a
                      href={`/listings/${lead.listing_id}`}
                      className="mt-3 inline-block text-sm font-bold text-blue-600 hover:underline"
                    >
                      View Listing →
                    </a>
                  )}
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