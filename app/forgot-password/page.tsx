"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const sendResetEmail = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent. Please check your inbox.");
    setEmail("");
  };

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

        <h1 className="mt-8 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-slate-600">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

        <div className="mt-8 space-y-4">
          <input
            value={email}
            className="w-full rounded-xl border p-4"
            placeholder="Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={sendResetEmail}
            disabled={sending}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Reset Email"}
          </button>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}