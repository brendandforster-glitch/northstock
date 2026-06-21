"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  company_name: string;
  email: string | null;
};

export default function AdminInviteSellerPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("new");

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  const [inviteLink, setInviteLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
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

    const { data } = await supabase
      .from("companies")
      .select("id, company_name, email")
      .order("company_name", { ascending: true });

    setCompanies((data || []) as Company[]);
    setLoading(false);
  }

  function resetForm() {
    setCompanyId("");
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setCity("");
    setProvince("");
    setInviteLink("");
  }

  function handleModeChange(nextMode: "existing" | "new") {
    setMode(nextMode);
    resetForm();
  }

  function handleCompanySelect(selectedId: string) {
    setCompanyId(selectedId);

    const company = companies.find((item) => item.id === selectedId);

    if (company) {
      setCompanyName(company.company_name || "");
      setEmail(company.email || "");
    }
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim() || !email.trim()) {
      alert("Please enter a company name and seller email.");
      return;
    }

    if (mode === "existing" && !companyId) {
      alert("Please select an existing company.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaving(false);
      alert("Please log in again.");
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/admin/create-seller-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        mode,
        companyId,
        companyName,
        contactName,
        email,
        phone,
        website,
        city,
        province,
      }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok || result.error) {
      alert(result.error || "Could not create invite.");
      return;
    }

    setInviteLink(result.inviteLink);
    await navigator.clipboard.writeText(result.inviteLink);

    alert("Invite created and link copied to clipboard.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading invite page...</p>
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
      <section className="mx-auto max-w-4xl px-6 py-10">
        <a href="/admin" className="text-sm font-bold text-slate-950">
          ← Back to Admin
        </a>

        <h1 className="mt-4 text-4xl font-bold">Invite Seller</h1>

        <p className="mt-3 text-slate-700">
          Create a company profile and invite a seller to claim it, or invite a
          seller to an existing company profile.
        </p>

        <form
          onSubmit={createInvite}
          className="mt-8 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
        >
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange("new")}
              className={`rounded-xl border px-5 py-4 font-semibold ${
                mode === "new"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-950"
              }`}
            >
              Create New Company
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("existing")}
              className={`rounded-xl border px-5 py-4 font-semibold ${
                mode === "existing"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-950"
              }`}
            >
              Use Existing Company
            </button>
          </div>

          <div className="grid gap-5">
            {mode === "existing" && (
              <select
                value={companyId}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="rounded-xl border border-slate-300 p-4 text-slate-950"
              >
                <option value="">Select company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            )}

            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name *"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact Name"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seller Email *"
              type="email"
              className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            {mode === "new" && (
              <>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
                />

                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Website"
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
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Creating Invite..." : "Create Invite Link"}
            </button>
          </div>
        </form>

        {inviteLink && (
          <div className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-bold">Invite Link Created</h2>

            <p className="mt-3 break-all text-slate-700">{inviteLink}</p>

            <button
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
            >
              Copy Link Again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}