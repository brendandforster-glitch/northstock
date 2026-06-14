"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Account created. You can now log in.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else window.location.href = "/listings";
  }

  async function handleSubmit() {
    if (mode === "login") {
      await signIn();
    } else {
      await signUp();
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
        <a href="/">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className="h-12 w-auto"
          />
        </a>

        <h1 className="mt-8 text-3xl font-extrabold text-slate-950">
          {mode === "login" ? "Log in to NorthStock" : "Create your account"}
        </h1>

        <p className="mt-2 text-base font-medium text-slate-800">
          {mode === "login"
            ? "Log in to browse inventory, save listings, and request quotes."
            : "Create a free account to browse inventory and list commercial items."}
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-xl border border-slate-300 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg py-3 text-sm font-bold ${
              mode === "login"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-700"
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-3 text-sm font-bold ${
              mode === "signup"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-700"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            className="w-full rounded-xl border border-slate-300 p-4 text-base text-slate-950 placeholder:text-slate-500"
            placeholder="Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            value={password}
            className="w-full rounded-xl border border-slate-300 p-4 text-base text-slate-950 placeholder:text-slate-500"
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white hover:bg-slate-800"
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>

          {mode === "login" && (
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-base font-semibold text-blue-600"
              >
                Forgot your password?
              </a>
            </div>
          )}

          {mode === "signup" && (
            <p className="text-center text-sm font-medium text-slate-700">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-bold text-blue-600"
              >
                Log in instead
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}