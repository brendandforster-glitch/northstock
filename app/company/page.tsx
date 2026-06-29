"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const userEmail = (user.email || "").toLowerCase().trim();

    const { data: companyByEmail, error: emailError } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .ilike("email", userEmail)
      .limit(1);

    if (emailError) {
      alert(emailError.message);
      setLoading(false);
      return;
    }

    let company = companyByEmail?.[0];

    if (!company) {
      const { data: companyByUser, error: userError } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userError) {
        alert(userError.message);
        setLoading(false);
        return;
      }

      company = companyByUser?.[0];
    }

    if (company) {
      setCompanyId(company.id);
      setCompanyName(company.company_name || "");
      setDescription(company.description || "");
      setWebsite(company.website || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setCity(company.city || "");
      setProvince(company.province || "");
      setLogoUrl(company.logo_url || "");
setBannerUrl(company.banner_url || "");
    } else {
      setCompanyId(null);
      setCompanyName("");
      setDescription("");
      setWebsite("");
      setPhone("");
      setEmail(user.email || "");
      setCity("");
      setProvince("");
      setLogoUrl("");
setBannerUrl("");
    }

    setLoading(false);
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadingLogo(false);
      window.location.href = "/login";
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `company-logos/${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("northstock-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setUploadingLogo(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("northstock-images")
      .getPublicUrl(filePath);

    setLogoUrl(data.publicUrl);
    setUploadingLogo(false);
  }

  async function saveCompany() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      window.location.href = "/login";
      return;
    }

    if (!companyName.trim()) {
      setSaving(false);
      alert("Company name is required.");
      return;
    }

    const payload = {
      user_id: user.id,
      company_name: companyName,
      description,
      website,
      phone,
      email,
      city,
      province,
      logo_url: logoUrl,
banner_url: bannerUrl,
    };

    let error;

    if (companyId) {
      const result = await supabase
        .from("companies")
        .update(payload)
        .eq("id", companyId);

      error = result.error;
    } else {
      const result = await supabase.from("companies").insert([payload]);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Company profile saved.");
    loadCompany();
  }

  const completionItems = [
  companyName,
  description,
  website,
  phone,
  email,
  city,
  province,
  logoUrl,
  bannerUrl,
];

const completedFields = completionItems.filter(
  (item) => item && item.toString().trim() !== ""
).length;

const completionPercent = Math.round(
  (completedFields / completionItems.length) * 100
);

const companyStrength =
  completionPercent >= 90
    ? "Excellent"
    : completionPercent >= 70
    ? "Strong"
    : completionPercent >= 50
    ? "Getting Started"
    : "Needs Work";
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading company profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-4">
            <a href="/seller" className="text-sm font-bold text-slate-950">
              Seller Dashboard
            </a>

            <a
              href="/list-inventory"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Add Inventory
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-4xl font-bold text-slate-950">Company Profile</h1>

        <p className="mt-2 text-slate-700">
          Create or update your public seller profile for NorthStock.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="font-bold text-slate-950">Company Profile Strength</p>
      <p className="mt-1 text-sm text-slate-600">
        {companyStrength} · {completedFields} of {completionItems.length} sections completed
      </p>
    </div>

    <p className="text-2xl font-bold text-slate-950">
      {completionPercent}%
    </p>
  </div>

  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
    <div
      className="h-full rounded-full bg-slate-950 transition-all"
      style={{ width: `${completionPercent}%` }}
    />
  </div>
</div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
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
                placeholder="About Your Company"
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
                placeholder="Company Email"
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

              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
                <label className="block text-sm font-bold text-slate-950">
                  Company Logo
                </label>

                <p className="mt-1 text-sm text-slate-600">
                  Upload a logo image or paste an image URL below.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950"
                />

                {uploadingLogo && (
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Uploading logo...
                  </p>
                )}

                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo Image URL"
                  className="mt-4 w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
                />
                <div className="mt-5">
  <label className="block text-sm font-bold text-slate-950">
    Banner Image URL
  </label>

  <p className="mt-1 text-sm text-slate-600">
    Optional. This image will appear across the top of your public company page.
  </p>

  <input
    value={bannerUrl}
    onChange={(e) => setBannerUrl(e.target.value)}
    placeholder="https://..."
    className="mt-3 w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
  />
</div>
              </div>

              <button
                onClick={saveCompany}
                disabled={saving || uploadingLogo}
                className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Company Profile"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
  <div
    className="h-28 bg-slate-950 bg-cover bg-center"
    style={
      bannerUrl
        ? {
            backgroundImage: `url(${bannerUrl})`,
          }
        : undefined
    }
  />

  <div className="p-6">
    <p className="text-sm font-semibold text-slate-500">
      Public Profile Preview
    </p>

    <div className="-mt-16 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName || "Company logo"}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-3xl font-bold text-slate-400">
          {companyName ? companyName.slice(0, 1) : "N"}
        </span>
      )}
    </div>

    <h2 className="mt-5 text-2xl font-bold text-slate-950">
      {companyName || "Company Name"}
    </h2>

    {(city || province) && (
      <p className="mt-2 text-sm text-slate-600">
        📍 {city}
        {province ? `, ${province}` : ""}
      </p>
    )}

    <p className="mt-4 text-sm leading-6 text-slate-700">
      {description || "Company description will appear here."}
    </p>

    <div className="mt-5 space-y-2 text-sm text-slate-700">
      {website && <p>🌐 {website}</p>}
      {phone && <p>📞 {phone}</p>}
      {email && <p>✉️ {email}</p>}
    </div>

    {companyId && (
      <a
        href={`/company/${companyId}`}
        className="mt-6 inline-block rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
      >
        View Public Profile
      </a>
    )}
  </div>
        </div>
      </div>
    </div>
  </main>
);
}