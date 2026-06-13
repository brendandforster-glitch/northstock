"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  province: string | null;
  description: string;
  image_url: string | null;
  status: string | null;
  expires_at: string | null;
  price: number | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
};

function formatPrice(price: number | null) {
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

export default function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        setUnavailable(true);
        setLoading(false);
        return;
      }

      setListing(data);
      setLoading(false);
    }

    loadListing();
  }, [id]);

  const requestQuote = async () => {
    if (!listing) return;

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setSubmitting(false);
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("leads").insert([
      {
        listing_id: listing.id,
        buyer_email: user.email,
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Quote request sent successfully!");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading listing...</p>
      </main>
    );
  }

  if (unavailable || !listing) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-2xl font-bold">Listing no longer available</h1>
        <p className="mt-2 text-slate-700">
          This inventory may have expired, sold, or been removed.
        </p>
        <a href="/listings" className="mt-4 inline-block text-slate-700">
          ← Back to listings
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <a href="/listings" className="text-sm font-semibold text-slate-700">
          ← Back to Listings
        </a>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex h-[450px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
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
            <p className="text-sm font-semibold text-slate-600">
              {listing.category}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-950">
              {listing.title}
            </h1>

            <p className="mt-4 text-3xl font-bold text-slate-950">
              {formatPrice(listing.price)}
            </p>

            <p className="mt-4 text-slate-700">
              {listing.city}
              {listing.province ? `, ${listing.province}` : ""}
            </p>

            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-300 bg-white p-6 text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-950">Quantity:</span>{" "}
                {listing.quantity}
              </p>

              {listing.condition && (
                <p>
                  <span className="font-semibold text-slate-950">
                    Condition:
                  </span>{" "}
                  {listing.condition}
                </p>
              )}

              {listing.brand && (
                <p>
                  <span className="font-semibold text-slate-950">Brand:</span>{" "}
                  {listing.brand}
                </p>
              )}

              {listing.model && (
                <p>
                  <span className="font-semibold text-slate-950">Model:</span>{" "}
                  {listing.model}
                </p>
              )}

              {listing.sku && (
                <p>
                  <span className="font-semibold text-slate-950">SKU:</span>{" "}
                  {listing.sku}
                </p>
              )}

              <p>
                <span className="font-semibold text-slate-950">Expires:</span>{" "}
                {formatDate(listing.expires_at)}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6">
              <h2 className="font-bold text-slate-950">Description</h2>
              <p className="mt-3 text-slate-700">
                {listing.description || "No description provided."}
              </p>
            </div>

            <button
              onClick={requestQuote}
              disabled={submitting}
              className="mt-8 w-full rounded-2xl bg-slate-950 py-4 text-lg font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Sending Request..." : "Request Quote"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}