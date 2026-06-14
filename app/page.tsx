"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FeaturedListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  price: number | null;
  image_url: string | null;
};

const categories = [
  {
    title: "Office Furniture",
    description: "Chairs, desks, workstations, filing cabinets and more.",
  },
  {
    title: "Restaurant Equipment",
    description: "Prep tables, refrigeration, ovens, sinks and more.",
  },
  {
    title: "Contractor Tools",
    description: "Power tools, compressors, generators and jobsite equipment.",
  },
];

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "Contact for pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>(
    []
  );
  const [listingCount, setListingCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);

  useEffect(() => {
    async function loadHomeData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLoggedIn(!!user);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, category, city, province, price, image_url")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(6);

      setFeaturedListings(listings || []);

      const { count: activeListingCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());

      setListingCount(activeListingCount || 0);

      const { count: companyCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      setSellerCount(companyCount || 0);
    }

    loadHomeData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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

          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="/listings">Browse Inventory</a>
            <a href="/list-inventory">List Inventory</a>
            <a href="/seller">Seller Dashboard</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <a
                  href="/seller"
                  className="text-sm font-semibold text-slate-950"
                >
                  Seller Dashboard
                </a>

                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-semibold text-slate-950"
                >
                  Log In
                </a>

                <a
                  href="/login"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Create Free Account
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Free buyer and seller accounts
            </p>

            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Buy and sell business inventory across North America.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              NorthStock helps businesses list, discover, and request quotes on
              commercial inventory including office furniture, restaurant
              equipment, and contractor tools. Search by province, city, radius,
              item, brand, model, or SKU.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {loggedIn ? (
                <>
                  <a
                    href="/seller"
                    className="rounded-xl bg-slate-950 px-6 py-4 text-center font-semibold text-white"
                  >
                    Seller Dashboard
                  </a>

                  <a
                    href="/listings"
                    className="rounded-xl border bg-white px-6 py-4 text-center font-semibold text-slate-950"
                  >
                    Browse Inventory
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="rounded-xl bg-slate-950 px-6 py-4 text-center font-semibold text-white"
                  >
                    Create Free Account
                  </a>

                  <a
                    href="/listings"
                    className="rounded-xl border bg-white px-6 py-4 text-center font-semibold text-slate-950"
                  >
                    Browse Inventory
                  </a>
                </>
              )}
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
              <div>Free signup</div>
              <div>City + radius search</div>
              <div>Bulk Excel uploads</div>
              <div>No buyer fees</div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Recently listed inventory
                </p>

                <a
                  href="/listings"
                  className="text-sm font-bold text-slate-950"
                >
                  View all
                </a>
              </div>

              <div className="mt-5 space-y-4">
                {featuredListings.length > 0 ? (
                  featuredListings.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-slate-500">
                          {item.city}
                          {item.province ? `, ${item.province}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <a
                        href={`/listings/${item.id}`}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        View
                      </a>
                    </div>
                  ))
                ) : (
                  <>
                    {[
                      "Herman Miller Aeron Chair",
                      "Stainless Steel Prep Table",
                      "DeWalt 20V Max Drill Set",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                      >
                        <div>
                          <p className="font-semibold">{item}</p>
                          <p className="text-sm text-slate-500">
                            Coming soon
                          </p>
                        </div>

                        <a
                          href="/listings"
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active Listings
            </p>
            <h2 className="mt-2 text-4xl font-bold">{listingCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Registered Sellers
            </p>
            <h2 className="mt-2 text-4xl font-bold">{sellerCount}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Marketplace Categories
            </p>
            <h2 className="mt-2 text-4xl font-bold">3</h2>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold">Why NorthStock?</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Free buyer accounts</h3>
              <p className="mt-2 text-sm text-slate-600">
                Browse inventory, save listings, save searches, and request
                quotes with no buyer fees.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Built for sellers</h3>
              <p className="mt-2 text-sm text-slate-600">
                Upload inventory one-by-one or in bulk using Excel, manage
                listings, and receive quote requests.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Search by location</h3>
              <p className="mt-2 text-sm text-slate-600">
                Buyers can search by item, city, province/state, or radius to
                find inventory nearby.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Commercial inventory only</h3>
              <p className="mt-2 text-sm text-slate-600">
                Focused on office furniture, restaurant equipment, and
                contractor tools.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Company profiles</h3>
              <p className="mt-2 text-sm text-slate-600">
                Sellers can create public profiles and showcase active
                inventory in one place.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-bold">Quote-based marketplace</h3>
              <p className="mt-2 text-sm text-slate-600">
                Buyers request quotes directly from listings so sellers can
                follow up with serious leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Featured Inventory</h2>

          <a
            className="text-sm font-semibold text-slate-700"
            href="/listings"
          >
            View all
          </a>
        </div>

        {featuredListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredListings.map((item) => (
              <a
                href={`/listings/${item.id}`}
                key={item.id}
                className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
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

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  {item.category}
                </p>

                <h3 className="mt-1 text-xl font-bold">{item.title}</h3>

                <p className="mt-2 font-semibold text-slate-950">
                  {formatPrice(item.price)}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {item.city}
                  {item.province ? `, ${item.province}` : ""}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border bg-white p-8 text-slate-600">
            Featured inventory will appear here as sellers add listings.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Browse by category</h2>

          <a
            className="text-sm font-semibold text-slate-700"
            href="/listings"
          >
            View all
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <a
              href="/listings"
              key={category.title}
              className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-2xl font-bold">{category.title}</h3>
              <p className="mt-3 text-slate-600">{category.description}</p>
              <p className="mt-6 font-semibold text-slate-950">Browse →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 rounded-3xl border bg-slate-950 p-8 text-white shadow-sm md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold">
              Have commercial inventory to sell?
            </h2>

            <p className="mt-3 text-slate-300">
              Create a free seller account, upload inventory, and start
              receiving quote requests from buyers across North America.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <a
              href="/list-inventory"
              className="rounded-xl bg-white px-6 py-4 text-center font-semibold text-slate-950"
            >
              List Inventory
            </a>

            <a
              href="/seller"
              className="rounded-xl border border-white/30 px-6 py-4 text-center font-semibold text-white"
            >
              Seller Dashboard
            </a>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <img
                src="/northstock-logo.png"
                alt="NorthStock"
                className="h-10 w-auto"
              />

              <h3 className="mt-6 font-bold">NorthStock</h3>
              <p className="mt-2 text-sm text-slate-600">
                North America's Commercial Inventory Marketplace.
              </p>
            </div>

            <div>
              <h3 className="font-bold">Contact Us</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:info@northstock.ca"
                    className="font-semibold text-slate-700"
                  >
                    info@northstock.ca
                  </a>
                </p>

                <p>
                  Phone:{" "}
                  <a
                    href="tel:6132814203"
                    className="font-semibold text-slate-700"
                  >
                    613-281-4203
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Marketplace</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  <a href="/listings">Browse Inventory</a>
                </p>

                <p>
                  <a href="/list-inventory">List Inventory</a>
                </p>

                <p>
                  <a href="/seller">Seller Dashboard</a>
                </p>

                <p>
                  <a href="/saved-searches">Saved Searches</a>
                </p>

                <p>
                  <a href="/saved-listings">Saved Listings</a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Categories</h3>

              <p className="mt-3 text-sm text-slate-600">
                Office Furniture · Restaurant Equipment · Contractor Tools
              </p>

              <p className="mt-5 text-sm text-slate-600">
                Looking to sell inventory? Create a free account and start
                listing today.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-sm text-slate-500">
            © 2026 NorthStock. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}