"use client";

import { useEffect, useState } from "react";
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

const regions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "British Columbia",
  "Alberta",
  "Saskatchewan",
  "Manitoba",
  "Ontario",
  "Quebec",
  "New Brunswick",
  "Nova Scotia",
  "Prince Edward Island",
  "Newfoundland and Labrador",
  "Yukon",
  "Northwest Territories",
  "Nunavut",
];

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

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const loadListings = async (regionFilter = selectedRegion) => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (regionFilter) {
      query = query.eq("province", regionFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setListings(data);
    } else {
      setListings([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadListings("");
  }, []);

  const applyFilters = () => {
    loadListings(selectedRegion);
  };

  const clearFilters = () => {
    setSelectedRegion("");
    loadListings("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading inventory...</p>
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
            <a href="/" className="text-sm font-semibold text-slate-700">
              Home
            </a>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Filters</h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Category
              </p>

              <div className="space-y-2 text-sm text-slate-700">
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
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Province / State
              </p>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950"
              >
                <option value="">All Provinces / States</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={applyFilters}
              className="w-full rounded-xl bg-slate-950 py-3 font-semibold text-white"
            >
              Apply Filters
            </button>

            <button
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-950"
            >
              Clear Filters
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory</h1>
              <p className="mt-1 text-slate-700">
                {selectedRegion
                  ? `Showing active listings in ${selectedRegion}`
                  : "Showing active, non-expired NorthStock listings across North America"}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-600">
              {listings.length} listing{listings.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-5">
            {listings.length > 0 ? (
              listings.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-5 rounded-3xl border border-slate-300 bg-white p-5 shadow-sm md:grid-cols-[180px_1fr_auto]"
                >
                  <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
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

                    <h2 className="mt-1 text-xl font-bold">{item.title}</h2>

                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {formatPrice(item.price)}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Quantity:
                        </span>{" "}
                        {item.quantity}
                      </p>

                      {item.condition && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Condition:
                          </span>{" "}
                          {item.condition}
                        </p>
                      )}

                      {item.brand && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Brand:
                          </span>{" "}
                          {item.brand}
                        </p>
                      )}

                      {item.model && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Model:
                          </span>{" "}
                          {item.model}
                        </p>
                      )}

                      {item.sku && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            SKU:
                          </span>{" "}
                          {item.sku}
                        </p>
                      )}

                      <p>
                        <span className="font-semibold text-slate-800">
                          Expires:
                        </span>{" "}
                        {formatDate(item.expires_at)}
                      </p>
                    </div>
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
              <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
                No active listings available for this filter.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}