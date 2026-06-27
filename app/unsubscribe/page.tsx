"use client";

import { useEffect, useState } from "react";

export default function UnsubscribePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    unsubscribeEmail();
  }, []);

  async function unsubscribeEmail() {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email") || "";

    setEmail(emailParam);

    if (!emailParam) {
      setErrorMessage("Missing email address.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailParam,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || "Unsubscribe failed.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Processing unsubscribe...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className="h-12 w-auto"
          />

          {success ? (
            <>
              <h1 className="mt-8 text-3xl font-bold">
                You have been unsubscribed
              </h1>

              <p className="mt-4 text-slate-700">
                {email} has been removed from NorthStock marketing emails.
              </p>

              <p className="mt-3 text-sm text-slate-600">
                You may still receive important account or transactional emails
                related to your NorthStock account.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-8 text-3xl font-bold">
                Unsubscribe could not be completed
              </h1>

              <p className="mt-4 text-slate-700">{errorMessage}</p>
            </>
          )}

          <a
            href="/"
            className="mt-8 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Return to NorthStock
          </a>
        </div>
      </section>
    </main>
  );
}