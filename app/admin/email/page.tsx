"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  subject: string;
  audience: string;
  status: string | null;
  sent_count: number | null;
  created_at: string | null;
  sent_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Not sent";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminEmailPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sending, setSending] = useState(false);

  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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
    setTestEmail(user.email || "");

    const { data } = await supabase
      .from("email_campaigns")
      .select("id, subject, audience, status, sent_count, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(10);

    setCampaigns((data || []) as Campaign[]);
    setLoading(false);
  }

  async function sendCampaign(testOnly: boolean) {
    if (!subject.trim()) {
      alert("Subject is required.");
      return;
    }

    if (!body.trim()) {
      alert("Email body is required.");
      return;
    }

    if (testOnly && !testEmail.trim()) {
      alert("Test email is required.");
      return;
    }

    if (!testOnly) {
      const confirmed = confirm(
        `Send this campaign to ${audience === "all" ? "all subscribers" : audience + "s"}?`
      );

      if (!confirmed) return;
    }

    setSending(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/admin/send-email-campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        audience,
        subject,
        body,
        testOnly,
        testEmail,
      }),
    });

    const result = await response.json();

    setSending(false);

    if (!response.ok) {
      alert(result.error || "Email send failed.");
      return;
    }

    alert(testOnly ? "Test email sent." : "Campaign sent.");
    loadPage();
  }
async function runSavedSearchAlerts() {
  const confirmed = confirm(
    "Run saved search email alerts now? This may send emails to users with matching saved searches."
  );

  if (!confirmed) return;

  setSending(true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    window.location.href = "/login";
    return;
  }

  const response = await fetch("/api/admin/send-saved-search-alerts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: session.access_token,
    }),
  });

  const result = await response.json();

  setSending(false);

  if (!response.ok) {
    alert(result.error || "Saved search alerts failed.");
    return;
  }

  alert(
    `Saved search alerts complete.\n\nSearches checked: ${result.searches_checked}\nListings checked: ${result.listings_checked}\nMatches found: ${result.matches_found}\nAlerts sent: ${result.alerts_sent}`
  );
}
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading email admin...</p>
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

        <div className="mt-4">
          <h1 className="text-4xl font-bold">Email Campaigns</h1>
          <p className="mt-2 text-slate-700">
            Send announcements and newsletters to NorthStock members.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Compose Campaign</h2>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Audience
                </label>

                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-950"
                >
                  <option value="all">All Subscribers</option>
                  <option value="member">Members</option>
                  <option value="seller">Sellers</option>
                  <option value="buyer">Buyers</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Message
                </label>

                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email message here..."
                  rows={12}
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Test Email
                </label>

                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Send test to..."
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => sendCampaign(true)}
                  disabled={sending}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-950 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Test Email"}
                </button>

                <button
                  onClick={() => sendCampaign(false)}
                  disabled={sending}
                  className="rounded-xl bg-slate-950 px-5 py-4 font-semibold text-white disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Campaign"}
                </button>
                <button
  onClick={runSavedSearchAlerts}
  disabled={sending}
  className="rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white disabled:opacity-50"
>
  Run Saved Search Alerts
</button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Preview</h2>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Subject</p>
              <h3 className="mt-1 text-xl font-bold">
                {subject || "Your subject will appear here"}
              </h3>

              <p className="mt-5 whitespace-pre-wrap text-slate-700">
                {body || "Your email message preview will appear here."}
              </p>

              <p className="mt-6 text-xs text-slate-500">
                NorthStock · You are receiving this because you are a NorthStock member. Unsubscribe link will be included automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Recent Campaigns</h2>

          <div className="mt-5 space-y-3">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-bold">{campaign.subject}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Audience: {campaign.audience} · Status:{" "}
                    {campaign.status || "draft"} · Sent:{" "}
                    {campaign.sent_count || 0} · Date:{" "}
                    {formatDate(campaign.sent_at || campaign.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-700">No campaigns yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}