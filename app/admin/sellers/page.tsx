"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  user_id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
  listing_count?: number;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminSellersPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSellers();
  }, []);

  async function loadSellers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

    if (!allowedAdmins.includes(user.email || "")) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const { data: companyData, error } = await supabase
      .from("companies")
      .select(
        "id, user_id, company_name, email, phone, website, city, province, created_at"
      )
      .order("company_name", { ascending: true });

    if (error || !companyData) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const companiesWithCounts = await Promise.all(
      companyData.map(async (company) => {
        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", company.user_id);

        return {
          ...company,
          listing_count: count || 0,
        };
      })
    );

    setCompanies(companiesWithCounts as Company[]);
    setLoading(false);
  }

  const filteredCompanies = companies.filter((company) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      company.company_name,
      company.email,
      company.phone,
      company.website,
      company.city,
      company.province,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading sellers...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold text-slate-950">Access denied</h1>
        <p className="mt-2 text-slate-700">
          You do not have permission to view this page.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <a href="/admin" className="text-sm font-bold text-slate-950">
          ← Back to Admin
        </a>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Manage Sellers</h1>
            <p className="mt-2 text-slate-700">
              View seller companies, listing counts, and contact details.
            </p>
          </div>

          <a
            href="/admin/upload"
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Upload Inventory For Seller
          </a>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-950">
            Search Sellers
          </label>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, email, city, province, website..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredCompanies.length} of {companies.length} sellers.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Seller Company
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {company.company_name}
                    </h2>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <strong>Email:</strong>{" "}
                        {company.email || "Not provided"}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {company.phone || "Not provided"}
                      </p>

                      <p>
                        <strong>Website:</strong>{" "}
                        {company.website || "Not provided"}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {company.city || "Unknown"}
                        {company.province ? `, ${company.province}` : ""}
                      </p>

                      <p>
                        <strong>Listings:</strong>{" "}
                        {company.listing_count || 0}
                      </p>

                      <p>
                        <strong>Created:</strong>{" "}
                        {formatDate(company.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:w-56">
                    <a
                      href={`/company/${company.id}`}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      View Public Profile
                    </a>

                    <a
                      href={`/admin/companies/${company.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit Company
                    </a>

                    <a
                      href={`/admin/upload?seller=${company.user_id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                    >
                      Upload Inventory
                    </a>

                    <a
                      href={`mailto:${company.email || ""}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                    >
                      Email Seller
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No sellers found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}