"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) {
        setListing(data);
      }

      setLoading(false);
    }

    loadListing();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p>Loading...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <a href="/listings" className="mt-4 inline-block text-slate-600">
          ← Back to listings
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <a href="/listings" className="text-sm font-semibold text-slate-600">
          ← Back to Listings
        </a>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex h-[450px] items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                "Listing Image"
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500">
              {listing.category}
            </p>

            <h1 className="mt-2 text-4xl font-bold">{listing.title}</h1>

            <p className="mt-4 text-slate-600">{listing.city}</p>

            <p className="mt-2 text-slate-600">
              {listing.quantity} Available
            </p>

            <div className="mt-8 rounded-2xl border bg-white p-6">
              <h2 className="font-bold">Description</h2>

              <p className="mt-3 text-slate-600">{listing.description}</p>
            </div>

            <button className="mt-8 w-full rounded-2xl bg-slate-950 py-4 text-lg font-semibold text-white">
              Request Quote
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}