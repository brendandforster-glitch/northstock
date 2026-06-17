"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  user_id: string;
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
  price_note: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
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

export default function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [listing, setListing] = useState<Listing | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingListing, setSavingListing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");

  useEffect(() => {
    async function loadListing() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.email) {
        setBuyerEmail(user.email);
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

      setListing(data as Listing);

      const { data: savedData } = await supabase
        .from("saved_listings")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", data.id)
        .maybeSingle();

      if (savedData) {
        setIsSaved(true);
      }

      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", data.user_id)
        .maybeSingle();

      if (companyData) {
        setCompany(companyData);
      }

      const { data: moreListings } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", data.user_id)
        .neq("id", data.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(6);

      if (moreListings) {
        setSellerListings(moreListings);
      }

      setLoading(false);
    }

    loadListing();
  }, [id]);

  const saveListing = async () => {
    if (!listing) return;

    setSavingListing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingListing(false);
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("saved_listings").insert([
      {
        user_id: user.id,
        listing_id: listing.id,
      },
    ]);

    setSavingListing(false);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        setIsSaved(true);
        alert("This listing is already saved.");
        return;
      }

      alert(error.message);
      return;
    }

    setIsSaved(true);
    alert("Listing saved.");
  };

  const requestQuote = async () => {
    if (!listing) return;

    if (!buyerName || !buyerEmail || !buyerMessage) {
      alert("Please complete your name, email, and message.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setSubmitting(false);
      window.location.href = "/login";
      return;
    }

    const fullMessage = `
Name: ${buyerName}
Email: ${buyerEmail}
Phone: ${buyerPhone || "Not provided"}

Message:
${buyerMessage}
    `.trim();

    const { error: leadError } = await supabase.from("leads").insert([
      {
        listing_id: listing.id,
        buyer_email: buyerEmail,
        message: fullMessage,
      },
    ]);

    if (leadError) {
      setSubmitting(false);
      alert(`Lead insert failed: ${leadError.message}`);
      return;
    }

    let emailMessage = "Email was not sent.";

    try {
      const emailResponse = await fetch("/api/send-quote-request-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerEmail: company?.email || "info@northstock.ca",
          buyerEmail,
          buyerName,
          buyerPhone,
          buyerMessage,
          listingTitle: listing.title,
          listingId: listing.id,
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok || emailResult.error) {
        emailMessage = `Email failed: ${JSON.stringify(emailResult.error)}`;
      } else {
        emailMessage = "Email notification sent.";
      }
    } catch {
      emailMessage = "Email failed due to a network or route error.";
    }

    setSubmitting(false);
    setShowQuoteForm(false);
    setBuyerName("");
    setBuyerPhone("");
    setBuyerMessage("");

    alert(`Quote request saved. ${emailMessage}`);
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
        <div className="flex items-center justify-between">
          <a href="/listings" className="text-sm font-semibold text-slate-700">
            ← Back to Listings
          </a>

          <a
            href="/saved-listings"
            className="text-sm font-semibold text-slate-700"
          >
            Saved Listings
          </a>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex h-[450px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="h-full w-full rounded-2xl object-contain p-2"
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
              {formatPrice(listing.price, listing.price_note)}
            </p>

            <p className="mt-4 text-slate-700">
              {listing.city}
              {listing.province ? `, ${listing.province}` : ""}
            </p>

            {company && (
              <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-5">
                <p className="text-sm text-slate-500">Sold By</p>

                <h3 className="mt-1 text-lg font-bold">
                  {company.company_name}
                </h3>

                <a
                  href={`/company/${company.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-blue-600"
                >
                  View Seller Profile →
                </a>
              </div>
            )}

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
              onClick={saveListing}
              disabled={savingListing || isSaved}
              className="mt-8 w-full rounded-2xl border border-slate-300 bg-white py-4 text-lg font-semibold text-slate-950 disabled:opacity-50"
            >
              {isSaved
                ? "Saved"
                : savingListing
                ? "Saving..."
                : "Save Listing"}
            </button>

            <button
              onClick={() => setShowQuoteForm(true)}
              disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-slate-950 py-4 text-lg font-semibold text-white disabled:opacity-50"
            >
              Request Quote
            </button>

            {sellerListings.length > 0 && company && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-slate-950">
                  More Listings From {company.company_name}
                </h2>

                <div className="mt-5 space-y-4">
                  {sellerListings.map((item) => (
                    <a
                      key={item.id}
                      href={`/listings/${item.id}`}
                      className="block rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500"
                    >
                      <p className="text-sm text-slate-500">
                        {item.category}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-slate-600">
                        {item.city}
                        {item.province ? `, ${item.province}` : ""}
                      </p>

                      <p className="mt-2 font-semibold text-slate-950">
                        {formatPrice(item.price, item.price_note)}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Request Quote
                </h2>

                <p className="mt-2 text-sm text-slate-700">
                  Send your details and any questions to the seller.
                </p>
              </div>

              <button
                onClick={() => setShowQuoteForm(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-bold text-slate-700"
              >
                X
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Name *"
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />

              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="Email *"
                type="email"
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />

              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="Phone"
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />

              <textarea
                value={buyerMessage}
                onChange={(e) => setBuyerMessage(e.target.value)}
                rows={5}
                placeholder="Ask about pricing, condition, shipping, availability, quantities, or any other questions."
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />

              <button
                onClick={requestQuote}
                disabled={submitting}
                className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Sending Request..." : "Send Quote Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}