"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export default function HelpLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLoggedIn(!!user);
    }

    checkUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
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

            <a href="/help" className="font-bold text-blue-600">
              Help
            </a>

            <a
              href="/#contact"
              className="transition hover:text-blue-600"
            >
              Contact
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap border-l border-slate-200 pl-6">
            {loggedIn ? (
              <>
                <a
                  href="/seller"
                  className="text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                >
                  Dashboard
                </a>

                <a
                  href="/buyer-requests/my-requests"
                  className="text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                >
                  My Requests
                </a>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                >
                  Log In
                </a>

                <a
                  href="/login"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create Free Account
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
