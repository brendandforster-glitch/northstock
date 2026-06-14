"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
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

  return (
    <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <a href="/">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className="h-12 w-auto"
          />
        </a>

        <h1 className="mt-8 text-3xl font-bold">Log in to NorthStock</h1>
        <p className="mt-2 text-black">
          Create an account or log in to browse inventory.
        </p>

        <div className="mt-8 space-y-4">
          <input
            value={email}
            className="w-full rounded-xl border p-4"
            placeholder="Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            value={password}
            className="w-full rounded-xl border p-4"
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={signIn}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white"
          >
            Log In
          </button>

          <button
            onClick={signUp}
            className="w-full rounded-xl border py-4 font-semibold"
          >
            Create Account
          </button>

          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-sm font-semibold text-black"
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}