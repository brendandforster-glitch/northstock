"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Invite = {
  id: string;
  company_id: string;
  company_name: string;
  contact_name: string | null;
  email: string;
  token: string;
  status: string | null;
};

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInvite();
  }, [token]);

  async function loadInvite() {
    const { data, error } = await supabase
      .from("seller_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (error || !data) {
      setInvite(null);
      setLoading(false);
      return;
    }

    setInvite(data as Invite);
    setLoading(false);
  }

  async function acceptInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!invite) return;

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setCreating(true);

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: invite.email,
        password,
      });

    if (signUpError) {
      setCreating(false);
      alert(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      setCreating(false);
      window.location.href = "/invite-success";
      return;
    }

    const { error: companyError } = await supabase
      .from("companies")
      .update({
        user_id: userId,
        email: invite.email,
      })
      .eq("id", invite.company_id);

    if (companyError) {
      setCreating(false);
      alert(companyError.message);
      return;
    }

    const { error: inviteError } = await supabase
      .from("seller_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    setCreating(false);

    if (inviteError) {
      alert(inviteError.message);
      return;
    }

    window.location.href = "/invite-success";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading invite...</p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold text-slate-950">
          Invite not found
        </h1>
        <p className="mt-2 text-slate-700">
          This invite may have already been accepted, expired, or is invalid.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className="h-12 w-auto"
          />

          <h1 className="mt-8 text-4xl font-bold">
            Create Your NorthStock Seller Account
          </h1>

          <p className="mt-4 text-slate-700">
            You have been invited to claim and manage the company profile for:
          </p>

          <div className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Company</p>
            <h2 className="mt-1 text-2xl font-bold">{invite.company_name}</h2>

            <p className="mt-3 text-sm text-slate-700">
              Account Email: <strong>{invite.email}</strong>
            </p>
          </div>

          <form onSubmit={acceptInvite} className="mt-8 space-y-5">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password"
              type="password"
              className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creating Account..." : "Create Seller Account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            After creating your account, you may need to confirm your email
            before logging in.
          </p>
        </div>
      </section>
    </main>
  );
}