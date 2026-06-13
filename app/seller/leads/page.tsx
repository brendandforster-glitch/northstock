"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  listing_id: string;
  buyer_email: string | null;
  created_at: string | null;
  listings: {
    id: string;
    title: string;
    category: string;
    city: string;
    province: string | null;
    price: number | null;
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

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SellerLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: sellerListings, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id);

    if (listingError || !sellerListings || sellerListings.length === 0) {
      setLeads([]);
      setLoading(false);
      return;
    }

    const listingIds = sellerListings.map((listing) => listing.id);

    const { data, error } = await supabase
      .from("leads")
      .select(
        `
        id,
        listing_id,
        buyer_email,
        created_at,
        listings (
          id,
          title,
          category,
          city,
          province,
          price
        )
      `
      )
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data as any);
    } else {
      setLeads([]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading quote requests...
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
            <a href="/seller" className="text-sm font-semibold text-slate-700">
              Seller Dashboard
            </a>

            <a href="/listings" className="text-sm font-semibold text-slate-700">
              Browse Inventory
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-4xl font-bold">Quote Requests</h1>

        <p className="mt-2 text-slate-700">
          View buyers who requested quotes on your inventory.
        </p>

        <div className="mt-8 space-y-5">
          {leads.length > 0 ? (
            leads.map((lead) => {
              const item = lead.listings;

              return (
                <div
                  key={lead.id}
                  className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {formatDate(lead.created_at)}
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        {item?.title || "Listing unavailable"}
                      </h2>

                      {item && (
                        <>
                          <p className="mt-2 text-slate-700">
                            {item.category}
                          </p>

                          <p className="mt-2 text-slate-700">
                            {item.city}
                            {item.province ? `, ${item.province}` : ""}
                          </p>

                          <p className="mt-2 font-semibold text-slate-950">
                            {formatPrice(item.price)}
                          </p>
                        </>
                      )}

                      <p className="mt-4 text-slate-700">
                        <span className="font-semibold text-slate-950">
                          Buyer Email:
                        </span>{" "}
                        {lead.buyer_email || "Not available"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 md:w-52">
                      {item && (
                        <a
                          href={`/listings/${item.id}`}
                          className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                        >
                          View Listing
                        </a>
                      )}

                      {lead.buyer_email && (
                        <a
                          href={`mailto:${lead.buyer_email}?subject=NorthStock Quote Request`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                        >
                          Email Buyer
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No quote requests yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}