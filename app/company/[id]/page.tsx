"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  province: string | null;
  logo_url: string | null;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
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
      .select("*")
      .eq("user_id", companyData.user_id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    setListings((listingData || []) as Listing[]);

    setLoading(false);
  }

  if (loading) {
    return <main className="min-h-screen p-10">Loading company...</main>;
  }

  if (!company) {
    return <main className="min-h-screen p-10">Company not found.</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          {company.logo_url && (
            <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="h-full w-full object-contain p-2"
              />
            </div>
          )}

          <h1 className="text-4xl font-bold text-slate-950">
            {company.company_name}
          </h1>

          {company.description && (
            <p className="mt-4 text-slate-700">{company.description}</p>
          )}

          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            {company.website && <p>🌐 {company.website}</p>}
            {company.phone && <p>📞 {company.phone}</p>}
            {company.email && <p>✉️ {company.email}</p>}
            {(company.city || company.province) && (
              <p>
                📍 {company.city}
                {company.province ? `, ${company.province}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-slate-950">
            Active Listings
          </h2>

          <div className="mt-6 space-y-4">
            {listings.length > 0 ? (
              listings.map((item) => (
                <a
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="block rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-slate-500"
                >
                  <p className="text-sm text-slate-500">{item.category}</p>

                  <h3 className="mt-1 text-xl font-bold text-slate-950">
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
              ))
            ) : (
              <div className="rounded-2xl border border-slate-300 bg-white p-6 text-slate-700">
                No active listings available from this seller.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}