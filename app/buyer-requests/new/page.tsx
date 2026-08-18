"use client";

import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function NewBuyerRequestPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data: companies } = await supabase
        .from("companies")
        .select("company_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (companies?.[0]?.company_name) {
        setCompanyName(companies[0].company_name);
      }

      setAuthChecking(false);
    }

    checkUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function submitBuyerRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      alert("Please log in before posting a buyer request.");
      return;
    }

    if (!title || !category || !description || !city || !province) {
      alert(
        "Please complete the title, category, description, city, and province/state."
      );
      return;
    }

    if (quantity && Number(quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    const { error } = await supabase.from("buyer_requests").insert([
      {
        user_id: userId,
        company_name: companyName.trim() || null,
        title: title.trim(),
        category,
        description: description.trim(),
        quantity: quantity ? Number(quantity) : null,
        budget: budget.trim() || null,
        city: city.trim(),
        province: province.trim(),
        is_public: isPublic,
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSuccess(true);
    setTitle("");
    setCategory("");
    setDescription("");
    setQuantity("");
    setBudget("");
    setCity("");
    setProvince("");
    setIsPublic(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950">
        <div className="mx-auto max-w-4xl">
          <p className="font-semibold">Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
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
              className="font-bold text-blue-600"
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

          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap border-l border-slate-200 pl-6">
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
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 shadow-sm">
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-extrabold tracking-wide text-white">
            FREE FOREVER
          </span>

          <span className="text-sm font-bold">
            Post what your business needs
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Post a Buyer Request
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Tell NorthStock suppliers what commercial inventory you need.
          Requests are free to post, with no buyer fees or commissions.
        </p>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-900">
            <p className="font-extrabold">
              Your buyer request was posted successfully.
            </p>

            <p className="mt-1 text-sm">
              It will remain active for 30 days unless you fulfil, pause, or
              remove it.
            </p>
          </div>
        )}

        <form
          onSubmit={submitBuyerRequest}
          className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="font-bold">Company name</span>

              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />
            </label>

            <label className="md:col-span-2">
              <span className="font-bold">What are you looking for? *</span>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: 50 ergonomic office chairs"
                maxLength={140}
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                required
              />
            </label>

            <label>
              <span className="font-bold">Category *</span>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4"
                required
              >
                <option value="">Select a category</option>

                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="font-bold">Quantity needed</span>

              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
                min="1"
                placeholder="Example: 50"
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />
            </label>

            <label className="md:col-span-2">
              <span className="font-bold">Request details *</span>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={7}
                placeholder="Describe the inventory, specifications, preferred condition, timing, delivery requirements, or other important details."
                maxLength={3000}
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                required
              />
            </label>

            <label>
              <span className="font-bold">Budget or target price</span>

              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Example: Up to $5,000"
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />
            </label>

            <div />

            <label>
              <span className="font-bold">City *</span>

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Example: Vancouver"
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                required
              />
            </label>

            <label>
              <span className="font-bold">Province or state *</span>

              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Example: British Columbia"
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
                required
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:col-span-2">
              <input
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                type="checkbox"
                className="mt-1 h-5 w-5"
              />

              <span>
                <span className="block font-extrabold">
                  Publish this request publicly
                </span>

                <span className="mt-1 block text-sm text-slate-600">
                  Your contact email will not be displayed. Suppliers will
                  respond through NorthStock’s protected response system.
                </span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-xl bg-slate-950 px-6 py-4 font-extrabold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Posting Request..." : "Post Buyer Request — Free"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            No posting fees, buyer fees, or commissions.
          </p>
        </form>
      </section>
    </main>
  );
}