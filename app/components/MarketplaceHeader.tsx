"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type NavKey = "browse" | "requests" | "sell" | "dashboard" | "help";

type MarketplaceHeaderProps = {
  active?: NavKey;
  loggedIn?: boolean;
  theme?: "dark" | "light";
};

const primaryLinks: Array<{ href: string; label: string; key: NavKey }> = [
  { href: "/listings", label: "Browse Inventory", key: "browse" },
  { href: "/buyer-requests", label: "Buyer Requests", key: "requests" },
  { href: "/list-inventory", label: "Sell Inventory", key: "sell" },
  { href: "/help", label: "Help Centre", key: "help" },
];

const accountLinks = [
  { href: "/seller", label: "Dashboard" },
  { href: "/saved-listings", label: "Saved Listings" },
  { href: "/saved-searches", label: "Saved Searches" },
  { href: "/buyer-requests/my-requests", label: "My Buyer Requests" },
  { href: "/company", label: "Company Profile" },
  { href: "/seller/buyer-responses", label: "My Responses" },
];

export default function MarketplaceHeader({
  active,
  loggedIn: loggedInProp,
  theme = "light",
}: MarketplaceHeaderProps) {
  const [detectedLogin, setDetectedLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loggedIn = loggedInProp ?? detectedLogin;
  const dark = theme === "dark";

  useEffect(() => {
    if (loggedInProp !== undefined) return;

    supabase.auth.getUser().then(({ data }) => {
      setDetectedLogin(!!data.user);
    });
  }, [loggedInProp]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const headerClass = dark
    ? "border-white/10 bg-[#020b20] text-white"
    : "border-slate-200 bg-white text-slate-950";
  const secondaryText = dark ? "text-slate-200" : "text-slate-700";
  const borderClass = dark ? "border-white/10" : "border-slate-200";
  const mobileSurface = dark ? "bg-[#06152f]" : "bg-slate-50";

  return (
    <header className={`sticky top-0 z-50 border-b ${headerClass}`}>
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" className="shrink-0" aria-label="NorthStock home">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className={`h-9 w-auto sm:h-10 ${dark ? "brightness-0 invert" : ""}`}
          />
        </a>

        <nav className={`ml-auto hidden items-center gap-6 text-sm font-semibold xl:flex ${secondaryText}`} aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={active === link.key ? "font-extrabold text-blue-500" : "transition hover:text-blue-500"}
            >
              {link.label}
            </a>
          ))}
          <a href="/#contact" className="transition hover:text-blue-500">Contact</a>
        </nav>

        <div className="ml-auto hidden items-center gap-3 xl:flex xl:ml-2">
          {loggedIn ? (
            <>
              <a
                href="/seller"
                className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${active === "dashboard" ? "bg-blue-600 text-white" : dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-950 hover:bg-slate-200"}`}
              >
                Dashboard
              </a>
              <details className="group relative">
                <summary className={`cursor-pointer list-none rounded-xl border px-4 py-2.5 text-sm font-bold transition [&::-webkit-details-marker]:hidden ${dark ? "border-white/20 text-white hover:bg-white/10" : "border-slate-300 text-slate-800 hover:bg-slate-50"}`}>
                  Account <span aria-hidden="true">⌄</span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-950 shadow-2xl">
                  {accountLinks.slice(1).map((link) => (
                    <a key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-50 hover:text-blue-700">
                      {link.label}
                    </a>
                  ))}
                  <button type="button" onClick={handleLogout} className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-700 hover:bg-red-50">
                    Log Out
                  </button>
                </div>
              </details>
            </>
          ) : (
            <>
              <a href="/login" className={`text-sm font-bold ${secondaryText}`}>Log In</a>
              <a href="/login" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500">
                Create Free Account
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="northstock-mobile-navigation"
          className={`ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-extrabold xl:hidden ${dark ? "border-white/20 bg-white/5 text-white" : "border-slate-300 bg-white text-slate-950"}`}
        >
          <span className="flex h-5 w-5 flex-col justify-center gap-1" aria-hidden="true">
            <span className="block h-0.5 w-5 rounded bg-current" />
            <span className="block h-0.5 w-5 rounded bg-current" />
            <span className="block h-0.5 w-5 rounded bg-current" />
          </span>
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div id="northstock-mobile-navigation" className={`max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t px-4 py-4 sm:px-6 xl:hidden ${borderClass} ${mobileSurface}`}>
          <nav className="mx-auto grid max-w-3xl grid-cols-2 gap-2" aria-label="Mobile navigation">
            {primaryLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`flex min-h-12 items-center rounded-xl border px-4 py-3 text-sm font-bold ${active === link.key ? "border-blue-500 bg-blue-600 text-white" : dark ? "border-white/10 bg-white/5 text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
              >
                {link.label}
              </a>
            ))}
            <a href="/#contact" className={`flex min-h-12 items-center rounded-xl border px-4 py-3 text-sm font-bold ${dark ? "border-white/10 bg-white/5 text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}>Contact</a>
          </nav>

          {loggedIn ? (
            <div className={`mx-auto mt-4 max-w-3xl border-t pt-4 ${borderClass}`}>
              <p className={`mb-2 text-xs font-extrabold uppercase tracking-[0.16em] ${dark ? "text-blue-300" : "text-blue-700"}`}>My NorthStock</p>
              <div className="grid grid-cols-2 gap-2">
                {accountLinks.map((link) => (
                  <a key={link.href} href={link.href} className={`flex min-h-12 items-center rounded-xl border px-4 py-3 text-sm font-bold ${link.href === "/seller" && active === "dashboard" ? "border-blue-500 bg-blue-600 text-white" : dark ? "border-white/10 bg-white/5 text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}>
                    {link.label}
                  </a>
                ))}
              </div>
              <button type="button" onClick={handleLogout} className="mt-3 min-h-12 w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left text-sm font-extrabold text-red-700">
                Log Out
              </button>
            </div>
          ) : (
            <div className={`mx-auto mt-4 grid max-w-3xl gap-2 border-t pt-4 sm:grid-cols-2 ${borderClass}`}>
              <a href="/login" className={`flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-extrabold ${dark ? "border-white/20 text-white" : "border-slate-300 text-slate-900"}`}>Log In</a>
              <a href="/login" className="flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white">Create Free Account</a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
