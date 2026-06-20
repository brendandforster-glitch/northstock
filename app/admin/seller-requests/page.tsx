"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SellerRequest = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  inventory_size: string | null;
  notes: string | null;
  created_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminSellerRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
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
      .from("seller_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setRequests(data as SellerRequest[]);
    setLoading(false);
  }

  const filteredRequests = requests.filter((request) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      request.company_name,
      request.contact_name,
      request.email,
      request.phone,
      request.category,
      request.inventory_size,
      request.notes,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading seller requests...
        </p>
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

        <div className="mt-4">
          <h1 className="text-4xl font-bold">Seller Requests</h1>
          <p className="mt-2 text-slate-700">
            View companies that requested help uploading inventory.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-950">
            Search Requests
          </label>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, contact, email, category, notes..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredRequests.length} of {requests.length} requests.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {formatDate(request.created_at)}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {request.company_name || "Unknown Company"}
                    </h2>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <strong>Contact:</strong>{" "}
                        {request.contact_name || "Not provided"}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {request.email || "Not provided"}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {request.phone || "Not provided"}
                      </p>

                      <p>
                        <strong>Category:</strong>{" "}
                        {request.category || "Not provided"}
                      </p>

                      <p>
                        <strong>Inventory Size:</strong>{" "}
                        {request.inventory_size || "Not provided"}
                      </p>
                    </div>

                    {request.notes && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                        <strong>Notes:</strong>
                        <p className="mt-2">{request.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 md:w-52">
                    {request.email && (
                      <a
                        href={`mailto:${request.email}?subject=NorthStock Inventory Upload Help`}
                        className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                      >
                        Email Contact
                      </a>
                    )}

                    {request.phone && (
                      <a
                        href={`tel:${request.phone}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
                      >
                        Call Contact
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No seller requests found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}