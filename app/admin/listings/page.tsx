"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
  status: string | null;
  expires_at: string | null;
  created_at: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  company_name?: string;
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

export default function AdminListingsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);

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

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setListings([]);
      setLoading(false);
      return;
    }

    const listingsWithCompanies = await Promise.all(
      data.map(async (listing) => {
        const { data: company } = await supabase
          .from("companies")
          .select("company_name")
          .eq("user_id", listing.user_id)
          .maybeSingle();

        return {
          ...listing,
          company_name: company?.company_name || "Unknown Seller",
        };
      })
    );

    setListings(listingsWithCompanies as Listing[]);
    setLoading(false);
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

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

  async function markSold(id: string) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadListings();
  }

  const filteredListings = listings.filter((item) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    return [
      item.title,
      item.category,
      item.city,
      item.province,
      item.brand,
      item.model,
      item.sku,
      item.status,
      item.company_name,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading listings...</p>
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <a href="/admin" className="text-sm font-bold text-slate-950">
          ← Back to Admin
        </a>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Manage Listings</h1>
            <p className="mt-2 text-slate-700">
              View, search, renew, mark sold, or delete marketplace listings.
            </p>
          </div>

          <a
            href="/admin/upload"
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Upload Inventory
          </a>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-950">
            Search Listings
          </label>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, seller, SKU, city, category, status..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredListings.length} of {listings.length} listings.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {item.company_name}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">{item.title}</h2>

                    <p className="mt-2 font-semibold text-slate-950">
                      {formatPrice(item.price, item.price_note)}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <strong>Category:</strong> {item.category}
                      </p>

                      <p>
                        <strong>Quantity:</strong> {item.quantity}
                      </p>

                      <p>
                        <strong>Status:</strong> {item.status || "Not set"}
                      </p>

                      <p>
                        <strong>Expires:</strong>{" "}
                        {formatDate(item.expires_at)}
                      </p>

                      <p>
                        <strong>Created:</strong>{" "}
                        {formatDate(item.created_at)}
                      </p>

                      {item.sku && (
                        <p>
                          <strong>SKU:</strong> {item.sku}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:w-56">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      View Listing
                    </a>

                    <a
                      href={`/seller/edit/${item.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit Listing
                    </a>

                    <button
                      onClick={() => renewListing(item.id)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
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
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No listings found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}