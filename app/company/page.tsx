"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState<string | null>(null);

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
  }, []);

  async function loadCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCompanyId(data.id);
      setCompanyName(data.company_name || "");
      setDescription(data.description || "");
      setWebsite(data.website || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setCity(data.city || "");
      setProvince(data.province || "");
      setLogoUrl(data.logo_url || "");
    }

    setLoading(false);
  }

  async function saveCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (!companyName) {
      alert("Company name is required.");
      return;
    }

    const payload = {
      user_id: user.id,
      company_name: companyName,
      description: description,
      website: website,
      phone: phone,
      email: email,
      city: city,
      province: province,
      logo_url: logoUrl,
    };

    let error;

    if (companyId) {
      const result = await supabase
        .from("companies")
        .update(payload)
        .eq("id", companyId);

      error = result.error;
    } else {
      const result = await supabase
        .from("companies")
        .insert([payload]);

      error = result.error;
    }

    if (error) {
      alert(error.message);
      return;
    }

    alert("Company profile saved.");
    loadCompany();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p>Loading company profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-4xl font-bold">
          Company Profile
        </h1>

        <p className="mt-2 text-slate-600">
          Create your company profile for NorthStock.
        </p>

        <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="grid gap-5">

            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              className="rounded-xl border p-4"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="About Your Company"
              rows={5}
              className="rounded-xl border p-4"
            />

            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website"
              className="rounded-xl border p-4"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="rounded-xl border p-4"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-xl border p-4"
            />

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-xl border p-4"
            />

            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Province / State"
              className="rounded-xl border p-4"
            />

            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Logo URL"
              className="rounded-xl border p-4"
            />

            <button
              onClick={saveCompany}
              className="rounded-xl bg-slate-950 py-4 font-semibold text-white"
            >
              Save Company Profile
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}