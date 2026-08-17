"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type BuyerRequest = {
  id: string;
  company_name: string | null;
  title: string;
  category: string;
  description: string;
  quantity: number | null;
  budget: string | null;
  city: string | null;
  province: string | null;
  status: string;
  fulfilled: boolean;
  expires_at: string;
  created_at: string;
};

export default function BuyerRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;

  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      if (!requestId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("buyer_requests")
        .select(
          "id, company_name, title, category, description, quantity, budget, city, province, status, fulfilled, expires_at, created_at"
        )
        .eq("id", requestId)
        .single();

      if (error || !data) {
        console.error(error);
        setNotFound(true);
        setRequest(null);
      } else {
        setRequest(data as BuyerRequest);
        setNotFound(false);
      }

      setLoading(false);
    }

    loadRequest();
  }, [requestId]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950">
        <div className="mx-auto max-w-5xl">
          <p className="font-semibold">Loading buyer request...</p>
        </div>
      </main>
    );
  }

  if (notFound || !request) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-6 py-16 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold">
            Buyer request unavailable
          </h1>

          <p className="mt-4 text-slate-600">
            This request may have expired, been fulfilled, made private, or
            removed by its owner.
          </p>

          <a
            href="/buyer-requests"
            className="mt-7 inline-block rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white"
          >
            Browse Active Requests
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

            <a
              href="/buyer-requests/new"
              className="rounded-xl bg-slate-950 px-5 py-3 text-white"
            >
              Post a Request
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <a
          href="/buyer-requests"
          className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-slate-950"
        >
          ← Back to Buyer Requests
        </a>

        <article className="mt-8 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 p-8 text-white md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-extrabold">
                {request.category}
              </span>

              <span className="text-sm font-semibold text-slate-300">
                Active until {formatDate(request.expires_at)}
              </span>
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl">
              {request.title}
            </h1>

            <p className="mt-4 text-lg font-semibold text-slate-300">
              {request.company_name || "NorthStock Buyer"}
            </p>

            {location && (
              <p className="mt-2 text-slate-400">{location}</p>
            )}
          </div>

          <div className="p-8 md:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Quantity Needed
                </p>

                <p className="mt-2 text-xl font-extrabold">
                  {request.quantity ?? "Not specified"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Budget
                </p>

                <p className="mt-2 text-xl font-extrabold">
                  {request.budget || "Open to proposals"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Posted
                </p>

                <p className="mt-2 text-xl font-extrabold">
                  {formatDate(request.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-extrabold">
                Request Details
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-700">
                {request.description}
              </p>
            </div>

            <div className="mt-10 rounded-3xl border border-blue-200 bg-blue-50 p-7">
              <h2 className="text-2xl font-extrabold">
                Can your business supply this inventory?
              </h2>

              <p className="mt-3 leading-7 text-slate-700">
                Respond through NorthStock. The buyer’s personal email address
                is not displayed publicly.
              </p>

              <a
                href={`/buyer-requests/${request.id}/respond`}
                className="mt-6 inline-block rounded-xl bg-blue-600 px-7 py-4 font-extrabold text-white hover:bg-blue-700"
              >
                Respond to This Request
              </a>
            </div>
          </div>
        </article>

        <div className="mt-8 rounded-3xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-extrabold">
            Looking for something else?
          </h2>

          <p className="mt-3 text-slate-300">
            Post your own commercial inventory request for free. There are no
            buyer fees or commissions.
          </p>

          <a
            href="/buyer-requests/new"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-4 font-extrabold text-slate-950"
          >
            Post a Buyer Request — Free
          </a>
        </div>
      </section>
    </main>
  );
}