"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type BuyerRequest = {
  id: string;
  title: string;
  category: string;
  quantity: number | null;
  budget: string | null;
  city: string | null;
  province: string | null;
  status: string;
  fulfilled: boolean;
  is_public: boolean;
  expires_at: string;
  created_at: string;
};

type SellerResponse = {
  id: string;
  request_id: string;
  company_name: string | null;
  message: string;
  price_quote: string | null;
  availability: string | null;
  status: string;
  created_at: string;
};

export default function MyBuyerRequestsPage() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [responses, setResponses] = useState<SellerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: requestData, error: requestError } = await supabase
      .from("buyer_requests")
      .select(
        "id, title, category, quantity, budget, city, province, status, fulfilled, is_public, expires_at, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error(requestError);
      setRequests([]);
      setResponses([]);
      setLoading(false);
      return;
    }

    const loadedRequests = (requestData || []) as BuyerRequest[];
    setRequests(loadedRequests);

    const requestIds = loadedRequests.map((request) => request.id);

    if (requestIds.length === 0) {
      setResponses([]);
      setLoading(false);
      return;
    }

    const { data: responseData, error: responseError } = await supabase
      .from("buyer_request_responses")
      .select(
        "id, request_id, company_name, message, price_quote, availability, status, created_at"
      )
      .in("request_id", requestIds)
      .order("created_at", { ascending: false });

    if (responseError) {
      console.error(responseError);
      setResponses([]);
    } else {
      setResponses((responseData || []) as SellerResponse[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateRequest(
    requestId: string,
    updates: Record<string, unknown>
  ) {
    setActionId(requestId);

    const { error } = await supabase
      .from("buyer_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    setActionId("");

    if (error) {
      alert(error.message);
      return;
    }

    await loadRequests();
  }

  async function reactivateRequest(requestId: string) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);

    await updateRequest(requestId, {
      status: "active",
      fulfilled: false,
      expires_at: newExpiry.toISOString(),
    });
  }

  async function deleteRequest(requestId: string) {
    const confirmed = window.confirm(
      "Delete this buyer request and all of its seller responses? This cannot be undone."
    );

    if (!confirmed) return;

    setActionId(requestId);

    const { error } = await supabase
      .from("buyer_requests")
      .delete()
      .eq("id", requestId);

    setActionId("");

    if (error) {
      alert(error.message);
      return;
    }

    await loadRequests();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold">Loading your buyer requests...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-5 text-sm font-bold">
            <a href="/buyer-requests">Buyer Requests</a>
            <a href="/listings">Browse Inventory</a>

            <a
              href="/buyer-requests/new"
              className="rounded-xl bg-slate-950 px-5 py-3 text-white"
            >
              Post a New Request
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700">
              Private buyer dashboard
            </div>

            <h1 className="mt-5 text-4xl font-extrabold md:text-5xl">
              My Buyer Requests
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Manage your requests and review private responses from suppliers.
            </p>
          </div>

          <a
            href="/buyer-requests/new"
            className="rounded-xl bg-blue-600 px-6 py-4 text-center font-extrabold text-white"
          >
            Post What You Need — Free
          </a>
        </div>

        {requests.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-3xl font-extrabold">
              You haven’t posted a buyer request yet
            </h2>

            <p className="mt-4 text-slate-600">
              Tell NorthStock suppliers what commercial inventory your
              business needs.
            </p>

            <a
              href="/buyer-requests/new"
              className="mt-7 inline-block rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white"
            >
              Post Your First Request
            </a>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {requests.map((request) => {
              const requestResponses = responses.filter(
                (response) => response.request_id === request.id
              );

              const expired =
                new Date(request.expires_at).getTime() <= Date.now();

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 p-7 md:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
                            {request.category}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-extrabold capitalize text-slate-700">
                            {expired ? "Expired" : request.status}
                          </span>

                          <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700">
                            {requestResponses.length}{" "}
                            {requestResponses.length === 1
                              ? "response"
                              : "responses"}
                          </span>
                        </div>

                        <h2 className="mt-5 text-2xl font-extrabold">
                          {request.title}
                        </h2>

                        <p className="mt-3 text-slate-600">
                          {[request.city, request.province]
                            .filter(Boolean)
                            .join(", ")}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
                          <span>
                            <strong>Quantity:</strong>{" "}
                            {request.quantity ?? "Not specified"}
                          </span>

                          <span>
                            <strong>Budget:</strong>{" "}
                            {request.budget || "Open to proposals"}
                          </span>

                          <span>
                            <strong>Expires:</strong>{" "}
                            {formatDate(request.expires_at)}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`/buyer-requests/${request.id}`}
                        className="rounded-xl border border-slate-300 px-5 py-3 text-center font-bold"
                      >
                        View Request
                      </a>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {request.status === "active" && !expired && (
                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() =>
                            updateRequest(request.id, {
                              status: "paused",
                            })
                          }
                          className="rounded-xl border border-slate-300 px-4 py-3 font-bold disabled:opacity-50"
                        >
                          Pause Request
                        </button>
                      )}

                      {request.status === "paused" && !expired && (
                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() =>
                            updateRequest(request.id, {
                              status: "active",
                            })
                          }
                          className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                        >
                          Resume Request
                        </button>
                      )}

                      {(expired ||
                        request.status === "fulfilled" ||
                        request.status === "expired") && (
                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() => reactivateRequest(request.id)}
                          className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                        >
                          Reactivate for 30 Days
                        </button>
                      )}

                      {!request.fulfilled && (
                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() =>
                            updateRequest(request.id, {
                              status: "fulfilled",
                              fulfilled: true,
                            })
                          }
                          className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                        >
                          Mark Fulfilled
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionId === request.id}
                        onClick={() => deleteRequest(request.id)}
                        className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                      >
                        Delete Request
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-7 md:p-8">
                    <h3 className="text-xl font-extrabold">
                      Supplier Responses
                    </h3>

                    {requestResponses.length === 0 ? (
                      <p className="mt-4 text-slate-600">
                        No suppliers have responded to this request yet.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {requestResponses.map((response) => (
                          <div
                            key={response.id}
                            className="rounded-2xl border border-slate-300 bg-white p-6"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="text-lg font-extrabold">
                                  {response.company_name ||
                                    "NorthStock Seller"}
                                </h4>

                                <p className="mt-1 text-sm text-slate-500">
                                  Responded {formatDate(response.created_at)}
                                </p>
                              </div>

                              <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold capitalize text-blue-700">
                                {response.status}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Price or Quote
                                </p>

                                <p className="mt-1 font-extrabold">
                                  {response.price_quote ||
                                    "Not specified"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Availability
                                </p>

                                <p className="mt-1 font-extrabold">
                                  {response.availability ||
                                    "Not specified"}
                                </p>
                              </div>
                            </div>

                            <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                              {response.message}
                            </p>

                            <p className="mt-5 text-sm font-semibold text-slate-500">
                              You can reply directly to the notification email
                              to contact this supplier.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}