"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type RelatedBuyerRequest = {
  id: string;
  company_name: string | null;
  title: string;
  category: string;
  status: string;
  fulfilled: boolean;
  expires_at: string;
  created_at: string;
};

type BuyerRequestResponse = {
  id: string;
  request_id: string;
  company_name: string | null;
  message: string;
  price_quote: string | null;
  availability: string | null;
  status:
    | "pending"
    | "shortlisted"
    | "accepted"
    | "declined";
  status_updated_at: string | null;
  created_at: string;
  request: RelatedBuyerRequest | null;
};

type StatusFilter =
  | "all"
  | "active"
  | "closed";

async function readJsonResponse(
  response: Response
) {
  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const body = await response.text();

    console.error(
      "Expected JSON response but received:",
      body.slice(0, 300)
    );

    throw new Error(
      "The response service is not available. Confirm the API route file is in the correct folder and restart the development server."
    );
  }

  return response.json();
}

function getBuyerDecision(
  status: BuyerRequestResponse["status"]
) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted by Buyer",
        className:
          "bg-green-100 text-green-800",
      };

    case "shortlisted":
      return {
        label: "Shortlisted",
        className:
          "bg-amber-100 text-amber-800",
      };

    case "declined":
      return {
        label: "Declined",
        className: "bg-red-100 text-red-800",
      };

    default:
      return {
        label: "Pending Buyer Review",
        className:
          "bg-slate-100 text-slate-700",
      };
  }
}

function formatDate(dateString: string) {
  return new Date(
    dateString
  ).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRequestStatus(
  request: RelatedBuyerRequest | null
) {
  if (!request) {
    return {
      label: "Unavailable",
      active: false,
      className:
        "bg-slate-200 text-slate-700",
    };
  }

  if (request.fulfilled) {
    return {
      label: "Fulfilled",
      active: false,
      className:
        "bg-green-100 text-green-800",
    };
  }

  if (
    new Date(request.expires_at).getTime() <=
    Date.now()
  ) {
    return {
      label: "Expired",
      active: false,
      className:
        "bg-amber-100 text-amber-800",
    };
  }

  if (request.status === "active") {
    return {
      label: "Active",
      active: true,
      className:
        "bg-blue-100 text-blue-800",
    };
  }

  const label = request.status
    ? request.status.charAt(0).toUpperCase() +
      request.status.slice(1)
    : "Closed";

  return {
    label,
    active: false,
    className:
      "bg-slate-200 text-slate-700",
  };
}

export default function SellerBuyerResponsesPage() {
  const [responses, setResponses] = useState<
    BuyerRequestResponse[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  useEffect(() => {
    loadResponses();
  }, []);

  async function loadResponses() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        "/api/seller/buyer-responses",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result =
        await readJsonResponse(response);

      if (!response.ok) {
        setResponses([]);

        setErrorMessage(
          result.error ||
            "Your buyer request responses could not be loaded."
        );

        setLoading(false);
        return;
      }

      setResponses(
        (result.responses ||
          []) as BuyerRequestResponse[]
      );
    } catch (error) {
      console.error(
        "Buyer response history error:",
        error
      );

      setResponses([]);

      setErrorMessage(
        "Your buyer request responses could not be loaded. Please try again."
      );
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const activeResponses =
    responses.filter(
      (response) =>
        getRequestStatus(response.request).active
    ).length;

  const shortlistedResponses =
    responses.filter(
      (response) =>
        response.status === "shortlisted"
    ).length;

  const acceptedResponses =
    responses.filter(
      (response) =>
        response.status === "accepted"
    ).length;

  const filteredResponses =
    responses.filter((response) => {
      const requestStatus =
        getRequestStatus(response.request);

      const buyerDecision =
        getBuyerDecision(response.status);

      if (
        statusFilter === "active" &&
        !requestStatus.active
      ) {
        return false;
      }

      if (
        statusFilter === "closed" &&
        requestStatus.active
      ) {
        return false;
      }

      const search =
        searchTerm.toLowerCase().trim();

      if (!search) {
        return true;
      }

      return [
        response.request?.title,
        response.request?.category,
        response.request?.company_name,
        response.company_name,
        response.message,
        response.price_quote,
        response.availability,
        requestStatus.label,
        buyerDecision.label,
      ]
        .filter(Boolean)
        .some((value) =>
          value!
            .toLowerCase()
            .includes(search)
        );
    });

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="overflow-x-auto border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-w-max max-w-[1600px] items-center gap-8 px-6 py-4">
          <a
            href="/"
            className="shrink-0"
          >
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
            <a
              href="/seller"
              className="transition hover:text-blue-600"
            >
              Dashboard
            </a>

            <a
              href="/seller/buyer-responses"
              className="text-blue-600"
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
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
              Seller tools
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
              My Buyer Request Responses
            </h1>

            <p className="mt-3 max-w-3xl text-lg text-slate-700">
              Review every Buyer Request you
              have answered and track whether
              the opportunity is still active.
            </p>
          </div>

          <a
            href="/buyer-requests"
            className="rounded-xl bg-slate-950 px-6 py-4 text-center font-extrabold text-white transition hover:bg-blue-700"
          >
            Browse Buyer Requests
          </a>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
            <p className="font-semibold text-slate-700">
              Loading your responses...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-xl font-extrabold text-red-900">
              Responses could not be loaded
            </h2>

            <p className="mt-2 text-red-800">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={loadResponses}
              className="mt-5 rounded-xl bg-red-700 px-5 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Total Responses
                </p>

                <p className="mt-2 text-4xl font-extrabold">
                  {responses.length}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Active Opportunities
                </p>

                <p className="mt-2 text-4xl font-extrabold text-blue-600">
                  {activeResponses}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Shortlisted
                </p>

                <p className="mt-2 text-4xl font-extrabold text-amber-600">
                  {shortlistedResponses}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Accepted by Buyer
                </p>

                <p className="mt-2 text-4xl font-extrabold text-green-600">
                  {acceptedResponses}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <label
                    htmlFor="response-search"
                    className="mb-3 block text-sm font-bold text-slate-800"
                  >
                    Search Your Responses
                  </label>

                  <input
                    id="response-search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search request title, category, company, quote, or message..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["active", "Active"],
                      ["closed", "Closed"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(value)
                      }
                      className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                        statusFilter === value
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Showing{" "}
                {filteredResponses.length} of{" "}
                {responses.length} response
                {responses.length === 1
                  ? ""
                  : "s"}
                .
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {filteredResponses.length > 0 ? (
                filteredResponses.map(
                  (response) => {
                    const requestStatus =
                      getRequestStatus(
                        response.request
                      );

                    const buyerDecision =
                      getBuyerDecision(
                        response.status
                      );

                    return (
                      <article
                        key={response.id}
                        className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-200 p-6 md:p-8">
                          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${requestStatus.className}`}
                                >
                                  {
                                    requestStatus.label
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${buyerDecision.className}`}
                                >
                                  {
                                    buyerDecision.label
                                  }
                                </span>

                                {response.request
                                  ?.category && (
                                  <span className="text-sm font-bold text-slate-500">
                                    {
                                      response
                                        .request
                                        .category
                                    }
                                  </span>
                                )}
                              </div>

                              <h2 className="mt-4 text-2xl font-extrabold md:text-3xl">
                                {response.request
                                  ?.title ||
                                  "Buyer request no longer available"}
                              </h2>

                              {response.request
                                ?.company_name && (
                                <p className="mt-2 font-semibold text-slate-600">
                                  Posted by{" "}
                                  {
                                    response
                                      .request
                                      .company_name
                                  }
                                </p>
                              )}

                              <p className="mt-2 text-sm text-slate-500">
                                Responded{" "}
                                {formatDate(
                                  response.created_at
                                )}{" "}
                                as{" "}
                                {response.company_name ||
                                  "NorthStock Seller"}
                              </p>
                            </div>

                            {response.request && (
                              <a
                                href={`/buyer-requests/${response.request.id}`}
                                className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-blue-700"
                              >
                                View Request
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="p-6 md:p-8">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-5">
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                Your Price or
                                Quote
                              </p>

                              <p className="mt-2 text-lg font-extrabold">
                                {response.price_quote ||
                                  "Not specified"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-5">
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                Your Availability
                              </p>

                              <p className="mt-2 text-lg font-extrabold">
                                {response.availability ||
                                  "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                              Your Message
                            </p>

                            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                              {response.message}
                            </p>
                          </div>

                          {requestStatus.active && (
                            <p className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                              This request is still
                              active. The buyer can
                              reply to the notification
                              email to continue the
                              conversation with you.
                            </p>
                          )}

                          {response.status ===
                            "accepted" && (
                            <p className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
                              The buyer accepted your
                              response. Check your
                              email and reply directly
                              to continue the
                              conversation.
                            </p>
                          )}

                          {response.status ===
                            "shortlisted" && (
                            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                              The buyer shortlisted
                              your response and is
                              still reviewing their
                              options.
                            </p>
                          )}

                          {response.status ===
                            "declined" && (
                            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
                              The buyer declined this
                              response. It remains in
                              your history for
                              reference.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  }
                )
              ) : (
                <div className="rounded-3xl border border-slate-300 bg-white p-10 text-center shadow-sm">
                  <h2 className="text-2xl font-extrabold">
                    {responses.length === 0
                      ? "No responses submitted yet"
                      : "No responses match your filters"}
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                    {responses.length === 0
                      ? "Browse active Buyer Requests and respond when your business can supply what a buyer needs."
                      : "Change the search or status filter to see more of your response history."}
                  </p>

                  {responses.length === 0 && (
                    <a
                      href="/buyer-requests"
                      className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-4 font-extrabold text-white"
                    >
                      Browse Buyer Requests
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}