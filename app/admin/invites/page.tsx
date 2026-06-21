"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Invite = {
  id: string;
  company_id: string | null;
  company_name: string;
  contact_name: string | null;
  email: string;
  token: string;
  status: string | null;
  created_at: string | null;
  accepted_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Not set";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminInvitesPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
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
      .from("seller_invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setInvites(data as Invite[]);
    setLoading(false);
  }

  const filteredInvites = invites.filter((invite) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      invite.company_name,
      invite.contact_name,
      invite.email,
      invite.status,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading invites...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold text-slate-950">Access denied</h1>
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
            <h1 className="text-4xl font-bold">Seller Invites</h1>
            <p className="mt-2 text-slate-700">
              Track pending and accepted seller invitations.
            </p>
          </div>

          <a
            href="/admin/invite-seller"
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Create Invite
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Invites</p>
            <h2 className="mt-2 text-3xl font-bold">{invites.length}</h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {invites.filter((invite) => invite.status === "pending").length}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Accepted</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {invites.filter((invite) => invite.status === "accepted").length}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-950">
            Search Invites
          </label>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, contact, email, status..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredInvites.length} of {invites.length} invites.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {filteredInvites.length > 0 ? (
            filteredInvites.map((invite) => {
              const inviteLink = `${window.location.origin}/invite/${invite.token}`;

              return (
                <div
                  key={invite.id}
                  className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Status:{" "}
                        <span
                          className={
                            invite.status === "accepted"
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        >
                          {invite.status || "pending"}
                        </span>
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        {invite.company_name}
                      </h2>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        <p>
                          <strong>Contact:</strong>{" "}
                          {invite.contact_name || "Not provided"}
                        </p>

                        <p>
                          <strong>Email:</strong> {invite.email}
                        </p>

                        <p>
                          <strong>Created:</strong>{" "}
                          {formatDate(invite.created_at)}
                        </p>

                        <p>
                          <strong>Accepted:</strong>{" "}
                          {formatDate(invite.accepted_at)}
                        </p>
                      </div>

                      <p className="mt-4 break-all rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        {inviteLink}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 md:w-52">
                      <button
                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Copy Invite Link
                      </button>

                      {invite.company_id && (
                        <a
                          href={`/admin/companies/${invite.company_id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                        >
                          Edit Company
                        </a>
                      )}

                      {invite.company_id && (
                        <a
                          href={`/company/${invite.company_id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                        >
                          View Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No invites found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}