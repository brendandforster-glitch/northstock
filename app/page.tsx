"use client";

import { CATEGORY_DETAILS } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatLocation } from "@/lib/international";
import MarketplaceHeader from "@/app/components/MarketplaceHeader";
import { useEffect, useState } from "react";

type FeaturedListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  country_code: string | null;
  currency_code: string | null;
  price: number | null;
  price_note: string | null;
  image_url: string | null;
};

type BuyerRequestPreview = {
  id: string;
  title: string;
  category: string;
  description: string;
  quantity: number | null;
  budget: string | null;
  city: string | null;
  province: string | null;
  country_code: string | null;
  currency_code: string | null;
};

function formatPrice(price: number | null, priceNote?: string | null, currencyCode?: string | null) {
  if (priceNote) return priceNote;
  return formatCurrency(price, currencyCode);
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.7 8.7 0 0 1-3-.88L4 20l1.55-4.13A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path d="M4 5.5V12l8 8 8-8-8-8H5.5A1.5 1.5 0 0 0 4 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="8.25" cy="8.25" r="1.25" fill="currentColor" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">✓</span>
      {children}
    </span>
  );
}

function HeroNetwork() {
  return (
    <svg viewBox="0 0 760 520" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-75" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="northstock-dots" width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#3b82f6" opacity="0.42" />
        </pattern>
        <linearGradient id="northstock-line" x1="0" x2="1">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0" />
          <stop offset="0.48" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="northstock-glow">
          <stop offset="0" stopColor="#93c5fd" stopOpacity="0.8" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M92 146c54-75 126-101 218-82 62 13 109 5 168 27 76 28 132 83 164 157-43 7-86 25-119 54-43 38-73 90-134 105-79 19-145-8-197-51-45-37-72-88-118-117-24-16-41-38-45-66 17-7 40-14 63-27Z" fill="url(#northstock-dots)" />
      <path d="M125 171Q300 72 477 179M215 351Q355 194 594 311M163 213Q355 337 550 142" stroke="url(#northstock-line)" strokeWidth="2" fill="none" />
      {[[126, 171], [216, 351], [477, 179], [594, 311], [550, 142]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="26" fill="url(#northstock-glow)" />
          <circle cx={cx} cy={cy} r="4.5" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequestPreview[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, category, city, province, country_code, currency_code, price, price_note, image_url")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(6);
      setFeaturedListings((listings || []) as FeaturedListing[]);

      const { data: requests } = await supabase
        .from("buyer_requests")
        .select("id, title, category, description, quantity, budget, city, province, country_code, currency_code")
        .eq("status", "active")
        .eq("fulfilled", false)
        .eq("is_public", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(3);
      setBuyerRequests((requests || []) as BuyerRequestPreview[]);

      if (user) {
        const [{ count: listingsTotal }, { count: companiesTotal }] = await Promise.all([
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active").gt("expires_at", new Date().toISOString()),
          supabase.from("companies").select("*", { count: "exact", head: true }),
        ]);
        setListingCount(listingsTotal || 0);
        setSellerCount(companiesTotal || 0);
      }
    }

    loadHomeData();
  }, []);

  function handleHomepageSearch(event: React.FormEvent) {
    event.preventDefault();
    const search = searchTerm.trim();
    window.location.href = search ? `/listings?search=${encodeURIComponent(search)}` : "/listings";
  }

  async function sendContactMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      alert("Please complete name, email, and message.");
      return;
    }

    setSendingContact(true);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage, website: "" }),
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

  const heroListings = featuredListings.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <MarketplaceHeader theme="dark" loggedIn={loggedIn} />

      <section className="relative isolate overflow-hidden bg-[#03112e] text-white">
        <div className="absolute inset-0 -z-20" style={{ background: "radial-gradient(circle at 73% 45%, rgba(37,99,235,.30), transparent 34%), radial-gradient(circle at 15% 15%, rgba(30,64,175,.18), transparent 28%), linear-gradient(125deg, #020617 0%, #03112e 52%, #071b46 100%)" }} />
        <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(96,165,250,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.16) 1px, transparent 1px)", backgroundSize: "52px 52px", maskImage: "linear-gradient(to bottom, transparent, black 28%, black 70%, transparent)" }} />

        <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8 lg:py-20 xl:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_14px_#60a5fa]" />
              Free for buyers and sellers
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-6xl xl:text-7xl">The global commercial inventory marketplace.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">Source used, surplus, overstock, and hard-to-find equipment directly from businesses worldwide.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/listings" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-extrabold shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:bg-blue-500">Explore Inventory <ArrowIcon /></a>
              <a href="/buyer-requests/new" className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/5 px-6 py-4 font-extrabold backdrop-blur transition hover:bg-white/10">Post a Buyer Request</a>
            </div>

            <form onSubmit={handleHomepageSearch} className="mt-6 flex max-w-2xl items-center rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-md">
              <span className="ml-3 text-blue-300"><SearchIcon /></span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search inventory, categories, or equipment..." className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-slate-400" />
              <button type="submit" className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-blue-50">Search</button>
            </form>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-300">
              <Check>No buyer fees</Check>
              <Check>No seller fees</Check>
              <Check>No commissions</Check>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[520px] lg:min-h-[560px]">
            <HeroNetwork />
            <div className="relative z-10 flex h-full flex-col justify-center gap-4 py-10 sm:pl-16 lg:pl-20 xl:pl-28">
              {heroListings.length > 0 ? heroListings.map((item, index) => (
                <a key={item.id} href={`/listings/${item.id}`} className={`group flex max-w-md gap-4 rounded-2xl border border-blue-300/30 bg-[#071a3a]/85 p-3 shadow-2xl shadow-black/35 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-300/60 ${index === 0 ? "sm:ml-20" : index === 2 ? "sm:ml-12" : ""}`}>
                  <div className="flex h-28 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                    {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : <span className="px-3 text-center text-xs font-bold uppercase tracking-wide text-blue-200">{item.category}</span>}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-blue-300">{item.category}</p>
                    <h2 className="mt-2 line-clamp-2 text-lg font-extrabold">{item.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-300"><PinIcon />{formatLocation(item.city, item.province, item.country_code)}</p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-300">View Details <ArrowIcon /></p>
                  </div>
                </a>
              )) : (
                <div className="mx-auto max-w-md rounded-3xl border border-blue-300/25 bg-[#071a3a]/85 p-8 text-center shadow-2xl backdrop-blur-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-300">NorthStock Marketplace</p>
                  <h2 className="mt-4 text-2xl font-extrabold">Commercial inventory from businesses worldwide</h2>
                  <p className="mt-3 text-slate-300">Explore active listings or post exactly what your business needs.</p>
                  <a href="/listings" className="mt-6 inline-flex items-center gap-2 font-bold text-blue-300">Browse Inventory <ArrowIcon /></a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">Built for commercial trade</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">One marketplace. More ways to move inventory.</h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              ["Browse Available Inventory", "Discover used, surplus, and overstock equipment from businesses around the world.", "/listings", <SearchIcon key="search" className="h-6 w-6" />],
              ["Post What You Need", "Tell suppliers what you are looking for and receive relevant responses.", "/buyer-requests/new", <MessageIcon key="message" />],
              ["List Used & Surplus Inventory", "Reach qualified buyers and move inventory without marketplace fees.", "/list-inventory", <TagIcon key="tag" />],
            ].map(([title, copy, href, icon]) => (
              <a key={title as string} href={href as string} className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 text-lg font-extrabold">{title}<span className="text-blue-600 transition group-hover:translate-x-1"><ArrowIcon /></span></span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{copy}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_DETAILS.slice(0, 4).map((category) => (
              <a key={category.title} href={`/listings?category=${encodeURIComponent(category.title)}`} className="flex items-center justify-between bg-slate-50 px-5 py-4 font-bold text-slate-800 transition hover:bg-blue-50 hover:text-blue-700">{category.title}<span aria-hidden="true">→</span></a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[#06152f] shadow-xl">
            <div className="flex flex-col gap-6 border-b border-white/10 p-8 text-white md:flex-row md:items-end md:justify-between md:p-10">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-400">Live commercial demand</p>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">Buyers looking for inventory</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">See what businesses are actively trying to source and respond directly through NorthStock.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="/buyer-requests" className="rounded-xl bg-white px-5 py-3.5 text-center font-extrabold text-slate-950">Browse Requests</a>
                <a href="/buyer-requests/new" className="rounded-xl bg-blue-600 px-5 py-3.5 text-center font-extrabold text-white">Post What You Need</a>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
              {buyerRequests.length > 0 ? buyerRequests.map((request) => (
                <article key={request.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-white">
                  <span className="self-start rounded-full bg-blue-500/15 px-3 py-2 text-xs font-extrabold text-blue-300">{request.category}</span>
                  <h3 className="mt-5 text-xl font-extrabold">{request.title}</h3>
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-300"><PinIcon />{formatLocation(request.city, request.province, request.country_code) || "Location flexible"}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/[0.06] p-3"><p className="text-xs font-bold uppercase text-slate-400">Quantity</p><p className="mt-1 font-extrabold">{request.quantity ?? "Flexible"}</p></div>
                    <div className="rounded-xl bg-white/[0.06] p-3"><p className="text-xs font-bold uppercase text-slate-400">Budget</p><p className="mt-1 font-extrabold">{request.budget ? `${request.budget} ${request.currency_code || "USD"}` : "Open"}</p></div>
                  </div>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-300">{request.description}</p>
                  <a href={`/buyer-requests/${request.id}`} className="mt-auto flex items-center gap-2 pt-6 font-extrabold text-blue-300">View Request <ArrowIcon /></a>
                </article>
              )) : (
                <div className="rounded-2xl border border-dashed border-blue-300/30 bg-white/[0.04] px-6 py-10 text-center text-white md:col-span-3">
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-300">Demand updates live</p>
                  <h3 className="mt-3 text-2xl font-black">New buyer requests will appear here</h3>
                  <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-300">Post the commercial inventory your business needs and let qualified suppliers respond directly.</p>
                  <a href="/buyer-requests/new" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-extrabold text-white transition hover:bg-blue-500">Post a Buyer Request <ArrowIcon /></a>
                </div>
              )}
            </div>
          </div>
      </section>

      {loggedIn && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-3">
            {[["Active Listings", listingCount.toLocaleString()], ["Registered Sellers", sellerCount.toLocaleString()], ["Marketplace Coverage", "Worldwide"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">Marketplace inventory</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Recently listed inventory</h2></div>
          <a href="/listings" className="flex items-center gap-2 font-extrabold text-blue-700">View all inventory <ArrowIcon /></a>
        </div>

        {featuredListings.length > 0 ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredListings.map((item) => (
              <a key={item.id} href={`/listings/${item.id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-56 items-center justify-center overflow-hidden bg-slate-100">
                  {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.03]" /> : <span className="text-sm font-bold uppercase tracking-wide text-slate-400">{item.category}</span>}
                </div>
                <div className="p-6">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">{item.category}</p>
                  <h3 className="mt-2 line-clamp-2 text-xl font-extrabold">{item.title}</h3>
                  <p className="mt-3 font-bold">{formatPrice(item.price, item.price_note, item.currency_code)}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600"><PinIcon />{formatLocation(item.city, item.province, item.country_code)}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-2xl font-extrabold">New commercial inventory is being added</h3>
            <p className="mt-3 text-slate-600">Browse the marketplace or create a free account to list inventory.</p>
            <a href="/listings" className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3.5 font-extrabold text-white">Browse Inventory</a>
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">Why NorthStock</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Built specifically for commercial buyers and suppliers.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">A focused marketplace for sourcing equipment, moving used and surplus inventory, and connecting directly—without marketplace fees.</p>
            <a href="/sellers/getting-started" className="mt-7 inline-flex items-center gap-2 font-extrabold text-blue-700">Seller getting started guide <ArrowIcon /></a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Buy direct", "Connect with commercial suppliers and compare inventory without unnecessary middlemen."],
              ["Source faster", "Search across categories, countries, cities, and regions from one marketplace."],
              ["Upload in bulk", "Add individual listings or professionally formatted Excel inventory files."],
              ["Stay in control", "Manage your public company profile, inventory, inquiries, and exports at any time."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">✓</span>
                <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-[#06152f] p-8 text-white shadow-xl md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-400">Simple onboarding</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">From account to connection in three steps</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Create your free account", "Join as a buyer, seller, or both and create your business profile."],
              ["02", "Upload or source inventory", "List inventory through the site or Excel, or search and post what you need."],
              ["03", "Connect directly", "Send quote requests and respond directly to commercial opportunities."],
            ].map(([number, title, copy]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <p className="text-3xl font-black text-blue-400">{number}</p><h3 className="mt-5 text-xl font-extrabold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/login" className="rounded-xl bg-blue-600 px-6 py-4 font-extrabold transition hover:bg-blue-500">Create Free Account</a>
            <a href="/help" className="rounded-xl border border-white/25 px-6 py-4 font-extrabold transition hover:bg-white/10">Visit Help Centre</a>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-slate-800 bg-[#020b20] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <img src="/northstock-logo.png" alt="NorthStock" className="h-10 w-auto brightness-0 invert" />
              <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">The global commercial inventory marketplace.</p>
              <p className="mt-5 text-sm font-semibold text-blue-300">Free for buyers and sellers.</p>
            </div>

            <div>
              <h3 className="font-extrabold">Marketplace</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p><a href="/listings" className="hover:text-white">Browse Inventory</a></p>
                <p><a href="/buyer-requests" className="hover:text-white">Buyer Requests</a></p>
                <p><a href="/buyer-requests/new" className="hover:text-white">Post a Buyer Request</a></p>
                <p><a href="/list-inventory" className="hover:text-white">List Inventory</a></p>
                <p><a href="/seller" className="hover:text-white">Seller Dashboard</a></p>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold">Resources</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p><a href="/help" className="hover:text-white">Help Centre</a></p>
                <p><a href="/sellers/getting-started" className="hover:text-white">Seller Getting Started</a></p>
                <p><a href="/saved-searches" className="hover:text-white">Saved Searches</a></p>
                <p><a href="/saved-listings" className="hover:text-white">Saved Listings</a></p>
                <p><a href="mailto:info@northstock.ca" className="hover:text-white">info@northstock.ca</a></p>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold">Send a Message</h3>
              <form onSubmit={sendContactMessage} className="mt-4 space-y-3">
                <input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Name" className="w-full rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400" />
                <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="Email" type="email" className="w-full rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400" />
                <textarea value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} placeholder="Message" rows={4} className="w-full rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400" />
                <button type="submit" disabled={sendingContact} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold transition hover:bg-blue-500 disabled:opacity-50">{sendingContact ? "Sending..." : "Send Message"}</button>
              </form>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 NorthStock. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/marketplace-guidelines" className="hover:text-white">Marketplace Guidelines</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
