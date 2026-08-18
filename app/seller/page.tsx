"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Listing = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  province: string | null;
  price: number | null;
  price_note: string | null;
  status: string | null;
  expires_at: string | null;
  sku: string | null;
  brand: string | null;
  model: string | null;
};

type Company = {
  id: string;
  company_name: string;
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

function formatDate(dateString: string | null) {
  if (!dateString) return "Not set";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SellerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteRequests, setQuoteRequests] = useState(0);
  const [listingViews, setListingViews] = useState(0);
  const [buyerResponseCount, setBuyerResponseCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      await fetch("/api/claim-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.access_token,
        }),
      });

      try {
        const buyerResponseRequest = await fetch(
          "/api/seller/buyer-responses",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        if (buyerResponseRequest.ok) {
          const result = await buyerResponseRequest.json();
          setBuyerResponseCount(result.responses?.length || 0);
        } else {
          setBuyerResponseCount(0);
        }
      } catch (error) {
        console.error("Buyer response count error:", error);
        setBuyerResponseCount(0);
      }
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("id, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const companyRow = companyData?.[0];

    if (companyRow) {
      setCompany(companyRow as Company);
    } else {
      setCompany(null);
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as Listing[]);

      const listingIds = data.map((listing) => listing.id);

      if (listingIds.length > 0) {
        const { count: leadCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("listing_id", listingIds);

        const { count: viewCount } = await supabase
          .from("listing_views")
          .select("*", { count: "exact", head: true })
          .in("listing_id", listingIds);

        setQuoteRequests(leadCount || 0);
        setListingViews(viewCount || 0);
      } else {
        setQuoteRequests(0);
        setListingViews(0);
      }
    } else {
      setListings([]);
      setQuoteRequests(0);
      setListingViews(0);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  async function deleteAllListings() {
    if (
      !confirm(
        "Are you sure you want to permanently delete ALL of your listings?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("All listings deleted.");
    loadDashboard();
  }

  async function renewListing(id: string) {
    const expiry = new Date();

    expiry.setDate(expiry.getDate() + 30);
    expiry.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: expiry.toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  async function renewAllListings() {
    const expiry = new Date();

    expiry.setDate(expiry.getDate() + 30);
    expiry.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        expires_at: expiry.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("All listings renewed.");
    loadDashboard();
  }

  async function markSold(id: string) {
    if (!confirm("Mark this listing as sold?")) return;

    const { error } = await supabase
      .from("listings")
      .update({
        status: "sold",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDashboard();
  }

  async function downloadInventory() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/seller/export-inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
      }),
    });

    if (!response.ok) {
      alert("Inventory export failed. Please try again.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "northstock-inventory.xlsx";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  }

  const activeListings = listings.filter(
    (listing) =>
      listing.status === "active" &&
      listing.expires_at &&
      new Date(listing.expires_at) > new Date()
  ).length;

  const soldListings = listings.filter(
    (listing) => listing.status === "sold"
  ).length;

  const expiredListings = listings.filter(
    (listing) =>
      listing.status !== "sold" &&
      (!listing.expires_at || new Date(listing.expires_at) <= new Date())
  ).length;

  const totalQuantity = listings.reduce(
    (total, listing) => total + Number(listing.quantity || 0),
    0
  );

  const quoteRequestsPerListing =
    listings.length > 0
      ? (quoteRequests / listings.length).toFixed(2)
      : "0.00";

  const viewsPerListing =
    listings.length > 0
      ? (listingViews / listings.length).toFixed(2)
      : "0.00";

  const sellerHealth =
    activeListings > 0 && quoteRequests > 0
      ? "Active with buyer interest"
      : activeListings > 0
        ? "Active inventory listed"
        : listings.length > 0
          ? "Needs renewal"
          : "No inventory listed";

  const filteredListings = listings.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return [
      item.title,
      item.category,
      item.city,
      item.province,
      item.sku,
      item.brand,
      item.model,
      item.status,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">
          Loading seller dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="overflow-x-auto border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-w-max max-w-[1600px] items-center gap-8 px-6 py-4">
          <a href="/" className="shrink-0">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-11 w-auto"
            />
          </a>

          <nav className="ml-auto flex items-center gap-6 whitespace-nowrap text-sm font-semibold text-slate-700">
            <a
              href="/listings"
              className="transition hover:text-blue-600"
            >
              Browse
            </a>

            <a
              href="/buyer-requests"
              className="transition hover:text-blue-600"
            >
              Buyer Requests
            </a>

            <a
              href="/list-inventory"
              className="transition hover:text-blue-600"
            >
              Sell Inventory
            </a>

            <a
              href="/help"
              className="transition hover:text-blue-600"
            >
              Help
            </a>

            <a
              href="/#contact"
              className="transition hover:text-blue-600"
            >
              Contact
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap border-l border-slate-200 pl-6 text-sm font-bold">
            <a href="/seller" className="text-blue-600">
              Dashboard
            </a>

            <a
              href="/seller/buyer-responses"
              className="transition hover:text-blue-600"
            >
              My Responses
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-5 py-3 text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Seller Dashboard
            </h1>

            <p className="mt-2 text-slate-700">
              Manage your NorthStock company profile, inventory, listing quote
              requests, and Buyer Request responses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {company ? (
              <>
                <a
                  href={`/company/${company.id}`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
                >
                  View Company Profile
                </a>

                <a
                  href="/company"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
                >
                  Manage Company Profile
                </a>
              </>
            ) : (
              <a
                href="/company"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Manage Company Profile
              </a>
            )}

            <a
              href="/seller/buyer-responses"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              View Buyer Responses
            </a>

            <a
              href="/seller/leads"
              className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
            >
              View Listing Quotes
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Listings
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {listings.length}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Quantity
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {totalQuantity}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {activeListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Expired
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {expiredListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Sold
            </p>

            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {soldListings}
            </h2>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Listing Quotes
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {quoteRequests}
            </h2>
          </div>

          <a
            href="/seller/buyer-responses"
            className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm transition hover:border-blue-400"
          >
            <p className="text-sm font-semibold text-blue-700">
              Buyer Responses
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {buyerResponseCount}
            </h2>
          </a>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Inventory Performance
              </h2>

              <p className="mt-2 text-slate-700">
                A quick snapshot of your inventory activity, visibility, and
                listing quote request performance.
              </p>
            </div>

            <a
              href="/seller/leads"
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              View Listing Quote Requests →
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Seller Status
              </p>

              <h3 className="mt-2 text-xl font-bold">
                {sellerHealth}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Listing Views
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                {listingViews}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Views / Listing
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                {viewsPerListing}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Quote Requests / Listing
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                {quoteRequestsPerListing}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Active Share
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                {listings.length > 0
                  ? `${Math.round(
                      (activeListings / listings.length) * 100
                    )}%`
                  : "0%"}
              </h3>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <a
            href="/list-inventory"
            className="rounded-xl bg-slate-950 px-5 py-4 text-center font-semibold text-white"
          >
            Add Inventory / Bulk Upload
          </a>

          <button
            type="button"
            onClick={downloadInventory}
            className="rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-950"
          >
            Download Current Inventory
          </button>

          <a
            href="/seller/buyer-responses"
            className="rounded-xl bg-blue-600 px-5 py-4 text-center font-semibold text-white"
          >
            My Buyer Responses
          </a>

          <button
            type="button"
            onClick={renewAllListings}
            className="rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-950"
          >
            Renew All Listings
          </button>

          <button
            type="button"
            onClick={deleteAllListings}
            className="rounded-xl bg-red-600 px-5 py-4 font-semibold text-white"
          >
            Delete All Listings
          </button>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <label
            htmlFor="inventory-search"
            className="mb-3 block text-sm font-semibold text-slate-800"
          >
            Search Your Inventory
          </label>

          <input
            id="inventory-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, SKU, brand, model, city, category, or status..."
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <p className="mt-3 text-sm text-slate-600">
            Showing {filteredListings.length} of {listings.length} listing
            {listings.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="space-y-5">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {item.category}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {item.title}
                    </h2>

                    <p className="mt-2 font-semibold text-slate-950">
                      {formatPrice(item.price, item.price_note)}
                    </p>

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <strong>Quantity:</strong> {item.quantity}
                      </p>

                      {item.sku && (
                        <p>
                          <strong>SKU:</strong> {item.sku}
                        </p>
                      )}

                      {item.brand && (
                        <p>
                          <strong>Brand:</strong> {item.brand}
                        </p>
                      )}

                      {item.model && (
                        <p>
                          <strong>Model:</strong> {item.model}
                        </p>
                      )}

                      <p>
                        <strong>Status:</strong>{" "}
                        {item.status || "Not set"}
                      </p>

                      <p>
                        <strong>Expires:</strong>{" "}
                        {formatDate(item.expires_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:w-48">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      View
                    </a>

                    <a
                      href={`/seller/edit/${item.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </a>

                    <button
                      type="button"
                      onClick={() => renewListing(item.id)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
                    >
                      Renew
                    </button>

                    <button
                      type="button"
                      onClick={() => markSold(item.id)}
                      className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Mark Sold
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteListing(item.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
              No inventory listings match your search.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}