"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  description: string;
  image_url: string | null;
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserAndLoadListings() {
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
        .order("created_at", { ascending: false });

      if (!error && data) {
        setListings(data);
      }

      setLoading(false);
    }

    checkUserAndLoadListings();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p>Loading inventory...</p>
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

          <a href="/" className="text-sm font-semibold text-slate-600">
            Home
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Filters</h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold">Category</p>

              <div className="space-y-2 text-sm text-slate-600">
                <label className="block">
                  <input type="checkbox" /> Office Furniture
                </label>
                <label className="block">
                  <input type="checkbox" /> Restaurant Equipment
                </label>
                <label className="block">
                  <input type="checkbox" /> Contractor Tools
                </label>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Location</p>
              <input
                placeholder="City or province"
                className="w-full rounded-xl border p-3 text-sm"
              />
            </div>

            <button className="w-full rounded-xl bg-slate-950 py-3 font-semibold text-white">
              Apply Filters
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory</h1>
              <p className="mt-1 text-slate-600">
                Showing live listings from your NorthStock database
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {listings.length > 0 ? (
              listings.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm md:grid-cols-[180px_1fr_auto]"
                >
                  <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
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
                    <p className="text-sm font-semibold text-slate-500">
                      {item.category}
                    </p>

                    <h2 className="mt-1 text-xl font-bold">{item.title}</h2>

                    <p className="mt-2 text-slate-600">{item.city}</p>

                    <p className="mt-2 text-sm text-slate-500">
                      {item.quantity} available
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border bg-white p-8 text-slate-600">
                No listings yet. Add inventory in Supabase to display it here.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}