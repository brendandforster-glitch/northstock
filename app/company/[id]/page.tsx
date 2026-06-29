"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  province: string | null;
  logo_url: string | null;
  banner_url: string | null;
  created_at: string | null;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
  condition: string | null;
  quantity: number | null;
  image_url: string | null;
  created_at: string | null;
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
  if (!dateString) return "Recently joined";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [id]);

  async function loadCompany() {
    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (!companyData) {
      setLoading(false);
      return;
    }

    setCompany(companyData as Company);

    const { data: listingData } = await supabase
      .from("listings")
      .select(
        "id, title, category, city, province, price, price_note, condition, quantity, image_url, created_at"
      )
      .eq("user_id", companyData.user_id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setListings((listingData || []) as Listing[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        Loading company...
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        Company not found.
      </main>
    );
  }

  const location = [company.city, company.province].filter(Boolean).join(", ");
  const newestListings = listings.slice(0, 3);

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
            <a href="/listings" className="text-sm font-bold text-slate-950">
              Browse Inventory
            </a>

            <a href="/help" className="text-sm font-bold text-slate-950">
              Help Centre
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <a href="/listings" className="text-sm font-bold text-slate-700">
          ← Back to Inventory
        </a>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
          <div
  className="h-40 bg-slate-950 bg-cover bg-center"
  style={
    company.banner_url
      ? {
          backgroundImage: `url(${company.banner_url})`,
        }
      : undefined
  }
/>

          <div className="p-8">
            <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-end">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.company_name}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-slate-400">
                      {company.company_name.slice(0, 1)}
                    </span>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
    Early Supplier
  </span>

  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
    Member since {formatDate(company.created_at)}
  </span>
</div>

                  <h1 className="text-4xl font-bold">
                    {company.company_name}
                  </h1>

                  {location && (
                    <p className="mt-2 text-slate-600">📍 {location}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-slate-950 px-5 py-3 text-center font-semibold text-white"
                  >
                    Visit Website
                  </a>
                )}

                {company.email && (
  <div className="rounded-xl bg-slate-950 px-5 py-3 text-center font-semibold text-white">
    {company.email}
  </div>
)}
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Active Listings</p>
                <h3 className="mt-2 text-3xl font-bold">{listings.length}</h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Member Since</p>
                <h3 className="mt-2 text-lg font-bold">
                  {formatDate(company.created_at)}
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Location</p>
                <h3 className="mt-2 text-lg font-bold">
                  {location || "Not listed"}
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Supplier Type</p>
                <h3 className="mt-2 text-lg font-bold">Commercial Seller</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">About {company.company_name}</h2>

              <p className="mt-4 leading-7 text-slate-700">
                {company.description ||
                  "This company has not added a description yet."}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Recent Inventory</h2>
                  <p className="mt-2 text-slate-600">
                    Latest active listings from this supplier.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {newestListings.length > 0 ? (
                  newestListings.map((item) => (
                    <a
  key={item.id}
  href={`/listings/${item.id}`}
  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-500"
>
  <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-500">
    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.title}
        className="h-full w-full object-contain p-3"
      />
    ) : (
      "Image"
    )}
  </div>

  <div className="p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
      {item.category}
    </p>

    <h3 className="mt-2 line-clamp-2 font-bold text-slate-950">
      {item.title}
    </h3>

    <p className="mt-2 font-bold text-slate-950">
      {formatPrice(item.price, item.price_note)}
    </p>

    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
      {item.condition && (
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {item.condition}
        </span>
      )}

      {item.quantity !== null && (
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Qty: {item.quantity}
        </span>
      )}
    </div>
  </div>
</a>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 text-slate-700 md:col-span-3">
                    No active listings available from this seller.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">All Active Listings</h2>

              <div className="mt-6 space-y-4">
                {listings.length > 0 ? (
                  listings.map((item) => (
                    <a
  key={item.id}
  href={`/listings/${item.id}`}
  className="grid gap-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500 md:grid-cols-[150px_1fr_auto]"
>
  <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.title}
        className="h-full w-full object-contain p-2"
      />
    ) : (
      "Image"
    )}
  </div>

  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
      {item.category}
    </p>

    <h3 className="mt-1 text-xl font-bold text-slate-950">
      {item.title}
    </h3>

    <p className="mt-2 text-slate-600">
      {item.city}
      {item.province ? `, ${item.province}` : ""}
    </p>

    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
      {item.condition && (
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {item.condition}
        </span>
      )}

      {item.quantity !== null && (
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Qty: {item.quantity}
        </span>
      )}
    </div>
  </div>

  <div className="text-lg font-bold text-slate-950">
    {formatPrice(item.price, item.price_note)}
  </div>
</a>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-300 bg-white p-6 text-slate-700">
                    No active listings available from this seller.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Contact Information</h2>

              <div className="mt-5 space-y-3">
  {company.website && (
    <a
      href={company.website}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-semibold text-slate-950 hover:border-slate-500"
    >
      🌐 Visit Website
    </a>
  )}

  {company.email && (
  <div className="rounded-xl border border-slate-300 bg-white px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      Email
    </p>
    <p className="mt-1 font-semibold text-slate-950">
      {company.email}
    </p>
  </div>
)}

{company.phone && (
  <div className="rounded-xl border border-slate-300 bg-white px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      Phone
    </p>
    <p className="mt-1 font-semibold text-slate-950">
      {company.phone}
    </p>
  </div>
)}

  {location && (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      📍 {location}
    </div>
  )}
</div>
            </section>

            <section className="rounded-3xl border border-slate-300 bg-slate-950 p-6 text-white shadow-sm">
  <h2 className="text-xl font-bold">
    Interested in this supplier?
  </h2>

  <p className="mt-3 leading-7 text-slate-300">
    Browse this supplier's active inventory, visit their website, or use the
    contact information above to discuss availability, pricing, or sourcing
    opportunities.
  </p>
</section>
          </aside>
        </div>
      </section>
    </main>
  );
}