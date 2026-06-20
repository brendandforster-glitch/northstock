"use client";

import { use, useEffect, useState } from "react";
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
};

export default function AdminEditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    loadCompany();
  }, [id]);

  async function loadCompany() {
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

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      alert("Company not found.");
      window.location.href = "/admin/sellers";
      return;
    }

    const companyData = data as Company;

    setCompany(companyData);
    setCompanyName(companyData.company_name || "");
    setDescription(companyData.description || "");
    setWebsite(companyData.website || "");
    setPhone(companyData.phone || "");
    setEmail(companyData.email || "");
    setCity(companyData.city || "");
    setProvince(companyData.province || "");
    setLogoUrl(companyData.logo_url || "");

    setLoading(false);
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) {
      alert("Company name is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("companies")
      .update({
        company_name: companyName,
        description,
        website,
        phone,
        email,
        city,
        province,
        logo_url: logoUrl,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Company profile updated.");
    window.location.href = "/admin/sellers";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading company...</p>
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

  if (!company) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold">Company not found.</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <a href="/admin/sellers" className="text-sm font-bold text-slate-950">
          ← Back to Sellers
        </a>

        <div className="mt-4">
          <h1 className="text-4xl font-bold">Edit Company Profile</h1>
          <p className="mt-2 text-slate-700">
            Update seller profile details from admin.
          </p>
        </div>

        <form
          onSubmit={saveCompany}
          className="mt-8 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-5">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name *"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Company Description"
              rows={5}
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />

              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Province / State"
                className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
              />
            </div>

            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Logo URL"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            {logoUrl && (
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-300 bg-white">
                <img
                  src={logoUrl}
                  alt={companyName || "Company logo"}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Company Profile"}
              </button>

              <a
                href={`/company/${company.id}`}
                className="rounded-xl border border-slate-300 bg-white py-4 text-center font-semibold text-slate-950"
              >
                View Public Profile
              </a>

              <a
                href={`/admin/upload?seller=${company.user_id}`}
                className="rounded-xl border border-slate-300 bg-white py-4 text-center font-semibold text-slate-950"
              >
                Upload Inventory
              </a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}