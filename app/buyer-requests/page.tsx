"use client";

import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

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
  expires_at: string;
  created_at: string;
};

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);

      const { data, error } = await supabase
        .from("buyer_requests")
        .select(
          "id, company_name, title, category, description, quantity, budget, city, province, expires_at, created_at"
        )
        .eq("status", "active")
        .eq("fulfilled", false)
        .eq("is_public", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setRequests([]);
      } else {
        setRequests((data || []) as BuyerRequest[]);
      }

      setLoading(false);
    }

    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesCategory =
        !category || request.category === category;

      const searchableText = [
        request.title,
        request.description,
        request.company_name,
        request.city,
        request.province,
        request.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [requests, search, category]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold">
            <a href="/listings">Browse Inventory</a>
            <a href="/seller">Seller Dashboard</a>

            <a
              href="/buyer-requests/new"
              className="rounded-xl bg-slate-950 px-5 py-3 text-white"
            >
              Post a Buyer Request
            </a>
          </nav>
        </div>
      </header>

      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-extrabold text-blue-300">
            Free for buyers and sellers
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            Buyers Looking for Inventory
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Browse active commercial inventory requests from businesses
            across Canada and the United States. Have what they need?
            Connect through NorthStock.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/buyer-requests/new"
              className="rounded-xl bg-blue-600 px-6 py-4 font-extrabold text-white hover:bg-blue-500"
            >
              Post What You Need — Free
            </a>

            <a
              href="/listings"
              className="rounded-xl border border-slate-600 px-6 py-4 font-extrabold text-white hover:bg-slate-800"
            >
              Browse Available Inventory
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_320px_auto]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests by item, company, city, or region..."
              className="rounded-xl border border-slate-300 p-4"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white p-4"
            >
              <option value="">All Categories</option>

              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
              className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold">
              Active Buyer Requests
            </h2>

            <p className="mt-1 text-slate-600">
              Public requests that are currently open.
            </p>
          </div>

          {!loading && (
            <p className="font-bold text-slate-700">
              {filteredRequests.length}{" "}
              {filteredRequests.length === 1 ? "request" : "requests"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-600">
              Loading buyer requests...
            </p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="flex flex-col rounded-3xl border border-slate-300 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
                    {request.category}
                  </span>

                  <span className="text-sm font-semibold text-slate-500">
                    Expires {formatDate(request.expires_at)}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-extrabold">
                  {request.title}
                </h3>

                <p className="mt-2 font-semibold text-slate-600">
                  {request.company_name || "NorthStock Buyer"}
                </p>

                {(request.city || request.province) && (
                  <p className="mt-2 text-slate-600">
                    {[request.city, request.province]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Quantity
                    </p>

                    <p className="mt-1 font-extrabold">
                      {request.quantity ?? "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Budget
                    </p>

                    <p className="mt-1 font-extrabold">
                      {request.budget || "Open to proposals"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-h-24 overflow-hidden leading-7 text-slate-600">
                  {request.description}
                </p>

                <div className="mt-auto pt-6">
                  <a
                    href={`/buyer-requests/${request.id}`}
                    className="block rounded-xl bg-slate-950 px-6 py-4 text-center font-extrabold text-white hover:bg-blue-700"
                  >
                    View Request
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="text-2xl font-extrabold">
              No matching buyer requests
            </h3>

            <p className="mt-3 text-slate-600">
              Try clearing the filters or be the first business to post a
              request in this category.
            </p>

            <a
              href="/buyer-requests/new"
              className="mt-6 inline-block rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white"
            >
              Post a Buyer Request — Free
            </a>
          </div>
        )}
      </section>
    </main>
  );
}