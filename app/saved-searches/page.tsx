"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SavedSearch = {
  id: string;
  name: string | null;
  category: string | null;
  city: string | null;
  province: string | null;
  radius_km: number | null;
  keyword: string | null;
  email_alerts_enabled: boolean | null;
  created_at: string | null;
};

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  async function loadSavedSearches() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedSearches(data);
    } else {
      setSavedSearches([]);
    }

    setLoading(false);
  }

  async function deleteSavedSearch(id: string) {
    if (!confirm("Delete this saved search?")) return;

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSavedSearches();
  }

  async function toggleEmailAlerts(search: SavedSearch) {
    const { error } = await supabase
      .from("saved_searches")
      .update({
        email_alerts_enabled: !search.email_alerts_enabled,
      })
      .eq("id", search.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSavedSearches();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading saved searches...
        </p>
      </main>
    );
  }

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
            <a href="/listings" className="text-sm font-semibold text-slate-700">
              Browse Inventory
            </a>

            <a href="/seller" className="text-sm font-semibold text-slate-700">
              Seller Dashboard
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-4xl font-bold">Saved Searches</h1>

        <p className="mt-2 text-slate-700">
          View, manage, and control email alerts for your saved inventory searches.
        </p>

        <div className="mt-8 space-y-5">
          {savedSearches.length > 0 ? (
            savedSearches.map((search) => (
              <div
                key={search.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {search.name || "Saved Search"}
                    </h2>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-950">
                          City:
                        </span>{" "}
                        {search.city || "Any"}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-950">
                          Province/State:
                        </span>{" "}
                        {search.province || "Any"}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-950">
                          Radius:
                        </span>{" "}
                        {search.radius_km ? `${search.radius_km} km` : "None"}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-950">
                          Email Alerts:
                        </span>{" "}
                        {search.email_alerts_enabled ? "On" : "Off"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:w-48">
                    <button
                      onClick={() => toggleEmailAlerts(search)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                      {search.email_alerts_enabled
                        ? "Turn Alerts Off"
                        : "Turn Alerts On"}
                    </button>

                    <button
                      onClick={() => deleteSavedSearch(search.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              You have not saved any searches yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}