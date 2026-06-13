"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sku, setSku] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    async function loadListing() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Listing not found.");
        window.location.href = "/seller";
        return;
      }

      setTitle(data.title || "");
      setCategory(data.category || "");
      setQuantity(data.quantity?.toString() || "");
      setPrice(data.price?.toString() || "");
      setCondition(data.condition || "");
      setBrand(data.brand || "");
      setModel(data.model || "");
      setSku(data.sku || "");
      setCity(data.city || "");
      setProvince(data.province || "");
      setDescription(data.description || "");
      setImageUrl(data.image_url || "");

      if (data.expires_at) {
        setExpiresAt(data.expires_at.split("T")[0]);
      }

      setLoading(false);
    }

    loadListing();
  }, [id]);

  async function saveChanges(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const { error } = await supabase
      .from("listings")
      .update({
        title,
        category,
        quantity: Number(quantity),
        price: price ? Number(price) : null,
        condition,
        brand,
        model,
        sku,
        city,
        province,
        description,
        image_url: imageUrl || null,
        expires_at: expiresAt
          ? new Date(expiresAt).toISOString()
          : null,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Listing updated successfully.");
    window.location.href = "/seller";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p>Loading listing...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <a
          href="/seller"
          className="text-sm font-semibold text-slate-700"
        >
          ← Back to Seller Dashboard
        </a>

        <h1 className="mt-4 text-4xl font-bold">
          Edit Listing
        </h1>

        <form
          onSubmit={saveChanges}
          className="mt-8 space-y-5 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Condition"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Brand"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="Province / State"
            className="w-full rounded-xl border p-4"
          />

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="w-full rounded-xl border p-4"
          />

          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl border p-4"
          />

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border p-4"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}