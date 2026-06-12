"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ListInventoryPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [inventorySize, setInventorySize] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
      }
    }

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !contactName || !email) {
      alert("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    alert(`Current User: ${user?.email ?? "NO USER FOUND"}`);

    console.log("Current User:", user);

    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("seller_requests")
      .insert([
        {
          company_name: companyName,
          contact_name: contactName,
          email,
          phone,
          category,
          inventory_size: inventorySize,
          notes,
        },
      ])
      .select();

    console.log("Insert Data:", data);
    console.log("Insert Error:", error);

    setSubmitting(false);

    if (error) {
      alert(`ERROR: ${error.message}`);
      return;
    }

    alert("Inventory request submitted successfully!");

    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setCategory("");
    setInventorySize("");
    setNotes("");
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold">
          List Your Inventory
        </h1>

        <p className="mt-3 text-slate-600">
          Upload inventory to NorthStock and connect with buyers across Canada.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl border bg-white p-8 shadow-sm"
        >
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name *"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contact Name *"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            type="email"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            className="w-full rounded-xl border p-4"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border p-4"
          >
            <option value="">Select Category</option>
            <option>Office Furniture</option>
            <option>Restaurant Equipment</option>
            <option>Contractor Tools</option>
          </select>

          <select
            value={inventorySize}
            onChange={(e) => setInventorySize(e.target.value)}
            className="w-full rounded-xl border p-4"
          >
            <option value="">Estimated Inventory Size</option>
            <option>1-50 Items</option>
            <option>50-500 Items</option>
            <option>500-5000 Items</option>
            <option>5000+ Items</option>
          </select>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us about your inventory..."
            className="w-full rounded-xl border p-4"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
          >
        {submitting
  ? "Submitting..."
  : "Request Inventory Upload"}
          </button>
        </form>
      </div>
    </main>
  );
}