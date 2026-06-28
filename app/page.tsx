"use client";

import { CATEGORY_DETAILS } from "@/lib/categories";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FeaturedListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
  image_url: string | null;
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

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLoggedIn(!!user);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, category, city, province, price, price_note, image_url")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(6);

      setFeaturedListings((listings || []) as FeaturedListing[]);

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

  async function sendContactMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!contactName || !contactEmail || !contactMessage) {
      alert("Please complete name, email, and message.");
      return;
    }

    setSendingContact(true);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: contactName,
        email: contactEmail,
        message: contactMessage,
      }),
    });

    setSendingContact(false);

    if (!response.ok) {
      alert("Message failed to send. Please email info@northstock.ca directly.");
      return;
    }

    alert("Message sent successfully.");

    setContactName("");
    setContactEmail("");
    setContactMessage("");
  }

  function handleHomepageSearch(e: React.FormEvent) {
    e.preventDefault();

    const search = searchTerm.trim();

    if (search) {
      window.location.href = `/listings?search=${encodeURIComponent(search)}`;
    } else {
      window.location.href = "/listings";
    }
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

          <nav className="hidden gap-8 text-sm font-bold text-slate-950 md:flex">
            <a href="/listings">Browse Inventory</a>
            <a href="/list-inventory">List Inventory</a>
            <a href="/seller">Seller Dashboard</a>
            <a href="/help">Help Centre</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <a href="/seller" className="text-sm font-semibold text-black">
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
                <a href="/login" className="text-sm font-semibold text-black">
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
      <p className="mb-4 inline-flex rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800">
        Commercial inventory sourcing, buying, and selling across North America.
      </p>

      <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
        Buy direct. Source faster. List commercial inventory for free.
      </h1>

      <p className="mt-6 max-w-xl text-lg text-slate-600">
        NorthStock helps businesses source commercial inventory directly from
        suppliers, compare availability, and save time.
      </p>

      <p className="mt-4 max-w-xl text-lg text-slate-600">
        Built for commercial furniture and equipment suppliers across North America.
      </p>

      <form
        onSubmit={handleHomepageSearch}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search desks, chairs, prep tables, refrigeration..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-4 text-slate-950 placeholder:text-slate-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white"
        >
          Search Inventory
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {loggedIn ? (
          <>
            <a
              href="/listings"
              className="rounded-xl bg-slate-950 px-6 py-4 text-center font-semibold text-white"
            >
              Browse Inventory
            </a>

            <a
              href="/seller"
              className="rounded-xl border bg-white px-6 py-4 text-center font-semibold text-slate-950"
            >
              Seller Dashboard
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

      <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm font-semibold text-slate-700 md:grid-cols-4">
        <div>✓ Buy Direct</div>
        <div>✓ Save Time</div>
        <div>✓ Compare Suppliers</div>
        <div>✓ No Seller Fees</div>
      </div>
    </div>

    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="rounded-2xl bg-slate-100 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Recently listed inventory
          </p>

          <a href="/listings" className="text-sm font-bold text-slate-950">
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
                    {formatPrice(item.price, item.price_note)}
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
                    <p className="text-sm text-slate-500">Coming soon</p>
                  </div>

                  <a href="/listings" className="rounded-lg border px-3 py-2 text-sm">
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
    Marketplace Coverage
  </p>

  <h2 className="mt-2 text-4xl font-bold">North America</h2>

  <p className="mt-2 text-slate-600">United States & Canada</p>
</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
  <div className="rounded-3xl border bg-white p-10 shadow-sm">
    <div className="max-w-5xl">
      <h2 className="text-4xl font-bold">
        Built for commercial buyers and suppliers.
      </h2>

      <p className="mt-5 text-lg text-slate-700">
        NorthStock is designed specifically for commercial inventory—not
        consumer classifieds. Whether you're sourcing equipment for a customer,
        reducing surplus inventory, or expanding your supplier network,
        NorthStock helps businesses buy and sell more efficiently.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-bold">
            For Buyers
          </h3>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>✓ Buy directly from commercial suppliers</li>
            <li>✓ Save time locating hard-to-find inventory</li>
            <li>✓ Compare supplier pricing and availability</li>
            <li>✓ Search across North America</li>
            <li>✓ Request quotes directly from sellers</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold">
            For Sellers
          </h3>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>✓ Reach buyers across North America</li>
            <li>✓ Receive direct quote requests</li>
            <li>✓ Create a public company profile</li>
            <li>✓ Bulk upload inventory using Excel</li>
            <li>✓ No seller fees during early access</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-slate-950 p-8 text-white">
        <h3 className="text-2xl font-bold">
          Increase margins by buying direct.
        </h3>

        <p className="mt-3 text-slate-300">
          Connect directly with commercial suppliers, compare inventory,
          eliminate unnecessary middlemen, and make purchasing decisions
          faster—all from one marketplace built exclusively for commercial
          businesses.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold">Why NorthStock?</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">Buy direct from suppliers</h3>
    <p className="mt-2 text-sm text-slate-600">
      Connect directly with commercial inventory sellers instead of relying on scattered listings, brokers, or general marketplaces.
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">Save time sourcing inventory</h3>
    <p className="mt-2 text-sm text-slate-600">
      Search across office furniture and restaurant equipment from one focused commercial marketplace.
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">Compare pricing and availability</h3>
    <p className="mt-2 text-sm text-slate-600">
      Review supplier inventory, pricing notes, locations, and availability before reaching out.
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">No seller fees</h3>
    <p className="mt-2 text-sm text-slate-600">
      Sellers can list inventory, receive direct quote requests, and build a public company profile without seller fees.
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">Bulk uploads and exports</h3>
    <p className="mt-2 text-sm text-slate-600">
      Sellers can upload inventory using Excel and download their current listings anytime with one click.
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 p-6">
    <h3 className="font-bold">Built for commercial inventory</h3>
    <p className="mt-2 text-sm text-slate-600">
      NorthStock is focused on business inventory, not consumer classifieds, making it easier for commercial buyers and suppliers to connect.
    </p>
  </div>
</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Featured Inventory</h2>

          <a className="text-sm font-semibold text-slate-700" href="/listings">
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
                      className="h-full w-full rounded-2xl object-contain p-2"
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
                  {formatPrice(item.price, item.price_note)}
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

          <a className="text-sm font-semibold text-slate-700" href="/listings">
            View all
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CATEGORY_DETAILS.map((category) => (
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
  <div className="rounded-3xl border bg-white p-8 shadow-sm">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Simple onboarding
      </p>

      <h2 className="mt-3 text-3xl font-bold md:text-4xl">
        How NorthStock Works
      </h2>

      <p className="mt-4 text-slate-700">
        Create an account, add or source inventory, and connect directly with
        commercial buyers and suppliers across North America.
      </p>
    </div>

    <div className="mt-10 grid gap-6 md:grid-cols-3">
      <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-bold text-white">
          1
        </div>

        <h3 className="mt-6 text-xl font-bold">Create Your Free Account</h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign up as a buyer, seller, or both. Sellers can create a public
          company profile and showcase their business.
        </p>
      </div>

      <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-bold text-white">
          2
        </div>

        <h3 className="mt-6 text-xl font-bold">Upload or Source Inventory</h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sellers can add listings individually or upload inventory in bulk
          using Excel. Buyers can search by item, category, location,
          condition, or radius.
        </p>
      </div>

      <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-bold text-white">
          3
        </div>

        <h3 className="mt-6 text-xl font-bold">Connect Directly</h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Buyers send quote requests directly to sellers, helping both sides
          move faster, compare options, and reduce unnecessary middlemen.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
  <div className="rounded-3xl border bg-slate-950 p-8 text-white shadow-sm">
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-bold md:text-4xl">
        Ready to use NorthStock?
      </h2>

      <p className="mt-4 text-slate-300">
        Whether you're sourcing commercial inventory or listing equipment for sale,
        NorthStock gives buyers and sellers a focused place to connect directly.
      </p>
    </div>

    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white p-7 text-slate-950">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          For Buyers
        </p>

        <h3 className="mt-3 text-2xl font-bold">Find inventory faster</h3>

        <ul className="mt-5 space-y-3 text-sm text-slate-700">
          <li>✓ Browse commercial suppliers across North America</li>
          <li>✓ Compare pricing, availability, and location</li>
          <li>✓ Search by item, condition, city, province/state, or radius</li>
          <li>✓ Request quotes directly from sellers</li>
        </ul>

        <a
          href="/listings"
          className="mt-7 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          Browse Inventory
        </a>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white p-7 text-slate-950">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          For Sellers
        </p>

        <h3 className="mt-3 text-2xl font-bold">List inventory for free</h3>

        <ul className="mt-5 space-y-3 text-sm text-slate-700">
          <li>✓ Create a public company profile</li>
          <li>✓ Upload listings one by one or in bulk with Excel</li>
          <li>✓ Receive direct quote requests from buyers</li>
          <li>✓ Export your inventory anytime</li>
        </ul>

        <a
          href="/list-inventory"
          className="mt-7 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          List Inventory
        </a>
      </div>
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

                <p>
  <a href="/help">Help Centre</a>
</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Send a Message</h3>

              <form onSubmit={sendContactMessage} className="mt-3 space-y-3">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950 placeholder:text-slate-500"
                />

                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950 placeholder:text-slate-500"
                />

                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Message"
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950 placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={sendingContact}
                  className="w-full rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {sendingContact ? "Sending..." : "Send Message"}
                </button>
              </form>
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