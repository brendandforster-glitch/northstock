"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      alert("Please complete both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setUpdating(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully. You can now log in.");
    window.location.href = "/login";
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

        <h1 className="mt-8 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-slate-600">
          Enter and confirm your new NorthStock password.
        </p>

        <div className="mt-8 space-y-4">
          <input
            value={password}
            className="w-full rounded-xl border p-4"
            placeholder="New Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            value={confirmPassword}
            className="w-full rounded-xl border p-4"
            placeholder="Confirm New Password"
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            onClick={updatePassword}
            disabled={updating}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </main>
  );
}