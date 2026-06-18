"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  listing_id: string;
  buyer_email: string | null;
  message: string | null;
  created_at: string | null;
  listings: {
    id: string;
    title: string;
    category: string;
    city: string;
    province: string | null;
    price: number | null;
    price_note: string | null;
  } | null;
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
  if (!dateString) return "Unknown date";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SellerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
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
        message,
        created_at,
        listings (
          id,
          title,
          category,
          city,
          province,
          price,
          price_note
        )
      `
      )
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLeads([]);
      setLoading(false);
      return;
    }

    setLeads((data || []) as unknown as Lead[]);
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
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-4">
            <a href="/seller" className="text-sm font-bold text-slate-950">
              Seller Dashboard
            </a>

            <a href="/listings" className="text-sm font-bold text-slate-950">
              Browse Inventory
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

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Quote Requests</h1>

            <p className="mt-2 text-slate-700">
              View buyers who requested quotes or information on your inventory.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Requests
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-950">
              {leads.length}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {leads.length > 0 ? (
            leads.map((lead) => {
              const item = lead.listings;

              return (
                <div
                  key={lead.id}
                  className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
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
                            {formatPrice(item.price, item.price_note)}
                          </p>
                        </>
                      )}

                      <div className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-5">
                        <p className="font-semibold text-slate-950">
                          Buyer Details
                        </p>

                        <p className="mt-3 text-slate-700">
                          <span className="font-semibold text-slate-950">
                            Buyer Email:
                          </span>{" "}
                          {lead.buyer_email || "Not available"}
                        </p>

                        <div className="mt-4">
                          <p className="font-semibold text-slate-950">
                            Message:
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-slate-700">
                            {lead.message || "No message provided."}
                          </p>
                        </div>
                      </div>
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
                          href={`mailto:${lead.buyer_email}?subject=NorthStock Quote Request - ${
                            item?.title || "Listing"
                          }`}
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
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">
                No quote requests yet
              </h2>

              <p className="mt-2">
                When buyers request quotes on your inventory, they will appear
                here.
              </p>

              <a
                href="/list-inventory"
                className="mt-5 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
              >
                Add Inventory
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}