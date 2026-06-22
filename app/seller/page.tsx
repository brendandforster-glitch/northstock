"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
  status: string | null;
  expires_at: string | null;
  sku: string | null;
  brand: string | null;
  model: string | null;
};

type Company = {
  id: string;
  company_name: string;
};

function formatPrice(price: number | null, priceNote?: string | null) {
  if (priceNote) return priceNote;
  if (price === null || price === undefined) return "Contact for pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Not set";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SellerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteRequests, setQuoteRequests] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    const {
  data: { session },
} = await supabase.auth.getSession();

if (session?.access_token) {
  await fetch("/api/claim-company", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: session.access_token,
    }),
  });
}

    const { data: companyData } = await supabase
      .from("companies")
      .select("id, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const companyRow = companyData?.[0];

    if (companyRow) {
      setCompany(companyRow as Company);
    } else {
      setCompany(null);
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as Listing[]);

      const listingIds = data.map((listing) => listing.id);

      if (listingIds.length > 0) {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("listing_id", listingIds);

        setQuoteRequests(count || 0);
      } else {
        setQuoteRequests(0);
      }
    } else {
      setListings([]);
      setQuoteRequests(0);
    }

    setLoading(false);
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  async function deleteAllListings() {
    if (
      !confirm(
        "Are you sure you want to permanently delete ALL of your listings?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("All listings deleted.");
    loadDashboard();
  }

  async function renewListing(id: string) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    expiry.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: expiry.toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  async function renewAllListings() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    expiry.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: expiry.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("All listings renewed.");
    loadDashboard();
  }

  async function markSold(id: string) {
    if (!confirm("Mark this listing as sold?")) return;

    const { error } = await supabase
      .from("listings")
      .update({
        status: "sold",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  const activeListings = listings.filter(
    (listing) =>
      listing.status === "active" &&
      listing.expires_at &&
      new Date(listing.expires_at) > new Date()
  ).length;

  const soldListings = listings.filter(
    (listing) => listing.status === "sold"
  ).length;

  const expiredListings = listings.filter(
    (listing) =>
      listing.status !== "sold" &&
      (!listing.expires_at || new Date(listing.expires_at) <= new Date())
  ).length;

  const totalQuantity = listings.reduce(
    (total, listing) => total + Number(listing.quantity || 0),
    0
  );

  const filteredListings = listings.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      item.title,
      item.category,
      item.city,
      item.province,
      item.sku,
      item.brand,
      item.model,
      item.status,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading seller dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-4">
            <a href="/listings" className="text-sm font-bold text-slate-950">
              Browse Inventory
            </a>

            <a href="/seller/leads" className="text-sm font-bold text-slate-950">
              Quote Requests
            </a>

            <a
              href="/list-inventory"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Add / Bulk Upload Inventory
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Seller Dashboard</h1>
            <p className="mt-2 text-slate-700">
              Manage your NorthStock company profile, inventory, and quote requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {company ? (
              <>
                <a
                  href={`/company/${company.id}`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
                >
                  View Company Profile
                </a>

                <a
                  href="/company"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
                >
                  Manage Company Profile
                </a>
              </>
            ) : (
              <a
                href="/company"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Manage Company Profile
              </a>
            )}

            <a
              href="/seller/leads"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              View Quote Requests
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Listings</p>
            <h2 className="mt-2 text-3xl font-bold">{listings.length}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Quantity</p>
            <h2 className="mt-2 text-3xl font-bold">{totalQuantity}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {activeListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Expired</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {expiredListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Sold</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {soldListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Quote Requests</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {quoteRequests}
            </h2>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-3">
          <a
            href="/list-inventory"
            className="rounded-xl bg-slate-950 px-5 py-4 text-center font-semibold text-white"
          >
            Add Inventory / Bulk Upload
          </a>

          <button
            onClick={renewAllListings}
            className="rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-950"
          >
            Renew All Listings
          </button>

          <button
            onClick={deleteAllListings}
            className="rounded-xl bg-red-600 px-5 py-4 font-semibold text-white"
          >
            Delete All Listings
          </button>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-semibold text-slate-800">
            Search Your Inventory
          </label>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, SKU, brand, model, city, category, or status..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredListings.length} of {listings.length} listing
            {listings.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="space-y-5">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {item.category}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">{item.title}</h2>

                    <p className="mt-2 font-semibold text-slate-950">
                      {formatPrice(item.price, item.price_note)}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <strong>Quantity:</strong> {item.quantity}
                      </p>

                      {item.sku && (
                        <p>
                          <strong>SKU:</strong> {item.sku}
                        </p>
                      )}

                      {item.brand && (
                        <p>
                          <strong>Brand:</strong> {item.brand}
                        </p>
                      )}

                      {item.model && (
                        <p>
                          <strong>Model:</strong> {item.model}
                        </p>
                      )}

                      <p>
                        <strong>Status:</strong> {item.status || "Not set"}
                      </p>

                      <p>
                        <strong>Expires:</strong>{" "}
                        {formatDate(item.expires_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:w-48">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      View
                    </a>

                    <a
                      href={`/seller/edit/${item.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </a>

                    <button
                      onClick={() => renewListing(item.id)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
                    >
                      Renew
                    </button>

                    <button
                      onClick={() => markSold(item.id)}
                      className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Mark Sold
                    </button>

                    <button
                      onClick={() => deleteListing(item.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No inventory listings match your search.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}