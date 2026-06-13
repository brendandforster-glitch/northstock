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
  status: string | null;
  expires_at: string | null;
  sku: string | null;
  brand: string | null;
  model: string | null;
};

export default function SellerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteRequests, setQuoteRequests] = useState(0);

  async function loadListings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data);

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

  useEffect(() => {
    loadListings();
  }, []);

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadListings();
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
    loadListings();
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

    loadListings();
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
    loadListings();
  }

  const activeListings = listings.filter(
    (listing) => listing.expires_at && new Date(listing.expires_at) > new Date()
  ).length;

  const expiredListings = listings.length - activeListings;

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex items-center gap-4">
  <a
    href="/listings"
    className="text-sm font-semibold text-slate-700"
  >
    Browse Inventory
  </a>

  <a
    href="/company"
    className="text-sm font-semibold text-slate-700"
  >
    Company Profile
  </a>

  <a
    href="/seller/leads"
    className="text-sm font-semibold text-slate-700"
  >
    Quote Requests
  </a>

  <a
    href="/list-inventory"
    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
  >
    Add Inventory
  </a>
</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Seller Dashboard</h1>
          <p className="mt-2 text-slate-700">
            Manage your NorthStock inventory.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Listings</p>
            <h2 className="mt-2 text-3xl font-bold">{listings.length}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Listings</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {activeListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Expired Listings</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {expiredListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Quote Requests</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {quoteRequests}
            </h2>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={renewAllListings}
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Renew All Listings
          </button>

          <button
            onClick={deleteAllListings}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
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

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <strong>Quantity:</strong> {item.quantity}
                      </p>

                      <p>
                        <strong>Price:</strong>{" "}
                        {item.price ? `$${item.price}` : "Contact for pricing"}
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
                        <strong>Status:</strong> {item.status}
                      </p>

                      <p>
                        <strong>Expires:</strong>{" "}
                        {item.expires_at
                          ? new Date(item.expires_at).toLocaleDateString()
                          : "Not set"}
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