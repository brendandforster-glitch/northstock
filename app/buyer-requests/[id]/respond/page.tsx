"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type BuyerRequest = {
  id: string;
  user_id: string;
  company_name: string | null;
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  expires_at: string;
};

export default function RespondToBuyerRequestPage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;

  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [pageError, setPageError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [priceQuote, setPriceQuote] = useState("");
  const [availability, setAvailability] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    async function loadPage() {
      if (!requestId) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !session.access_token) {
        window.location.href = "/login";
        return;
      }

      setAccessToken(session.access_token);

      const { data: requestData, error: requestError } = await supabase
        .from("buyer_requests")
        .select(
          "id, user_id, company_name, title, category, city, province, expires_at"
        )
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        console.error(requestError);
        setPageError(
          "This buyer request could not be found or is no longer available."
        );
        setLoading(false);
        return;
      }

      if (requestData.user_id === session.user.id) {
        setPageError("You cannot respond to your own buyer request.");
        setRequest(requestData as BuyerRequest);
        setLoading(false);
        return;
      }

      setRequest(requestData as BuyerRequest);

      const { data: companies } = await supabase
        .from("companies")
        .select("company_name")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (companies?.[0]?.company_name) {
        setCompanyName(companies[0].company_name);
      }

      setLoading(false);
    }

    loadPage();
  }, [requestId]);

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault();

    if (!request || !accessToken) {
      alert("Please log in again.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message for the buyer.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/respond-to-buyer-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        requestId: request.id,
        companyName,
        priceQuote,
        availability,
        message,
      }),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      alert(result.error || "Your response could not be sent.");
      return;
    }

    setNotificationSent(result.notificationSent === true);
    setSuccess(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950">
        <div className="mx-auto max-w-4xl">
          <p className="font-semibold">Loading response form...</p>
        </div>
      </main>
    );
  }

  if (pageError || !request) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-6 py-16 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold">
            Unable to Respond
          </h1>

          <p className="mt-4 text-slate-600">
            {pageError || "This request is unavailable."}
          </p>

          <a
            href="/buyer-requests"
            className="mt-7 inline-block rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white"
          >
            Browse Buyer Requests
          </a>
        </div>
      </main>
    );
  }

  const location = [request.city, request.province]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-5 text-sm font-bold">
            <a href="/listings">Browse Inventory</a>
            <a href="/buyer-requests">Buyer Requests</a>
            <a href="/seller">Seller Dashboard</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <a
          href={`/buyer-requests/${request.id}`}
          className="font-bold text-slate-600 hover:text-slate-950"
        >
          ← Back to Request
        </a>

        {success ? (
          <div className="mt-8 rounded-3xl border border-green-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-6 text-4xl font-extrabold">
              Response Sent
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Your response to <strong>{request.title}</strong> has been saved.
            </p>

            {notificationSent ? (
              <p className="mt-3 font-semibold text-green-700">
                The buyer was notified by email.
              </p>
            ) : (
              <p className="mt-3 font-semibold text-amber-700">
                Your response was saved, but the email notification could not
                be confirmed. The buyer will still be able to see it in their
                NorthStock account.
              </p>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/buyer-requests"
                className="rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white"
              >
                Browse More Requests
              </a>

              <a
                href="/seller"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-extrabold"
              >
                Seller Dashboard
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
              <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-extrabold">
                {request.category}
              </span>

              <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">
                Respond to: {request.title}
              </h1>

              <p className="mt-3 font-semibold text-slate-300">
                {request.company_name || "NorthStock Buyer"}
              </p>

              {location && (
                <p className="mt-2 text-slate-400">{location}</p>
              )}
            </div>

            <form
              onSubmit={submitResponse}
              className="mt-8 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-extrabold">
                Your Supply Proposal
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Tell the buyer what you can supply. NorthStock will privately
                notify them and allow them to reply to your verified account
                email.
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="font-bold">Your company name</span>

                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                    maxLength={150}
                    className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                  />
                </label>

                <label>
                  <span className="font-bold">Price or quote</span>

                  <input
                    value={priceQuote}
                    onChange={(e) => setPriceQuote(e.target.value)}
                    placeholder="Example: $4,500 delivered"
                    maxLength={250}
                    className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                  />
                </label>

                <label>
                  <span className="font-bold">Availability</span>

                  <input
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="Example: Available immediately"
                    maxLength={250}
                    className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="font-bold">Message to the buyer *</span>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    maxLength={3000}
                    placeholder="Describe the inventory you have, its condition, location, delivery options, and any other relevant details."
                    className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                    required
                  />

                  <span className="mt-2 block text-right text-sm text-slate-500">
                    {message.length}/3000
                  </span>
                </label>
              </div>

              <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-extrabold">
                  Private contact protection
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The buyer’s email address is not shown to you. NorthStock
                  sends this proposal to the buyer, who can reply directly to
                  your verified account email.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-extrabold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Sending Response..."
                  : "Send Response to Buyer"}
              </button>

              <p className="mt-4 text-center text-sm text-slate-500">
                NorthStock charges no response fees or commissions.
              </p>
            </form>
          </>
        )}
      </section>
    </main>
  );
}