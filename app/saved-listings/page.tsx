"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SavedListing = {
  id: string;
  listing_id: string;
  created_at: string | null;
  listings: {
    id: string;
    title: string;
    category: string;
    city: string;
    province: string | null;
    price: number | null;
    image_url: string | null;
    status: string | null;
    expires_at: string | null;
  } | null;
};

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "Contact for pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function SavedListingsPage() {
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedListings();
  }, []);

  async function loadSavedListings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select(
        `
        id,
        listing_id,
        created_at,
        listings (
          id,
          title,
          category,
          city,
          province,
          price,
          image_url,
          status,
          expires_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedListings(data as any);
    } else {
      setSavedListings([]);
    }

    setLoading(false);
  }

  async function removeSavedListing(id: string) {
    if (!confirm("Remove this saved listing?")) return;

    const { error } = await supabase.from("saved_listings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSavedListings();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading saved listings...</p>
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
            <a href="/listings" className="text-sm font-semibold text-slate-700">
              Browse Inventory
            </a>

            <a
              href="/saved-searches"
              className="text-sm font-semibold text-slate-700"
            >
              Saved Searches
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-4xl font-bold">Saved Listings</h1>

        <p className="mt-2 text-slate-700">
          View and manage inventory listings you saved.
        </p>

        <div className="mt-8 space-y-5">
          {savedListings.length > 0 ? (
            savedListings.map((saved) => {
              const item = saved.listings;

              if (!item) return null;

              return (
                <div
                  key={saved.id}
                  className="grid gap-5 rounded-3xl border border-slate-300 bg-white p-5 shadow-sm md:grid-cols-[160px_1fr_auto]"
                >
                  <div className="flex h-32 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      "Image"
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {item.category}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">{item.title}</h2>

                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {formatPrice(item.price)}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:w-44">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      View Details
                    </a>

                    <button
                      onClick={() => removeSavedListing(saved.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              You have not saved any listings yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}