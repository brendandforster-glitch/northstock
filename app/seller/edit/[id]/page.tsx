"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = ["Office Furniture", "Restaurant Equipment", "Contractor Tools"];

const regions = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario",
  "Quebec", "New Brunswick", "Nova Scotia", "Prince Edward Island",
  "Newfoundland and Labrador", "Yukon", "Northwest Territories", "Nunavut",
];

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");
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

      if (data.user_id !== user.id) {
        alert("You do not have permission to edit this listing.");
        window.location.href = "/seller";
        return;
      }

      setTitle(data.title || "");
      setCategory(data.category || "");
      setQuantity(data.quantity?.toString() || "");
      setPrice(data.price?.toString() || "");
      setPriceNote(data.price_note || "");
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

  async function uploadListingImage(file: File) {
    setUploadingImage(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadingImage(false);
      window.location.href = "/login";
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `listing-images/${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("northstock-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setUploadingImage(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("northstock-images")
      .getPublicUrl(filePath);

    setImageUrl(data.publicUrl);
    setUploadingImage(false);
  }

  async function getCoordinates(cityValue: string, provinceValue: string) {
    const { data } = await supabase
      .from("city_coordinates")
      .select("latitude, longitude")
      .ilike("city", cityValue.trim())
      .eq("province", provinceValue.trim())
      .maybeSingle();

    return {
      latitude: data?.latitude ?? null,
      longitude: data?.longitude ?? null,
    };
  }

  async function saveChanges(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !category || !quantity || !city || !province) {
      alert("Please complete title, category, quantity, city, and province/state.");
      return;
    }

    setSaving(true);

    const coordinates = await getCoordinates(city, province);

    const { error } = await supabase
      .from("listings")
      .update({
        title,
        category,
        quantity: Number(quantity),
        price: price ? Number(price) : null,
        price_note: priceNote || null,
        condition,
        brand,
        model,
        sku,
        city,
        province,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        description,
        image_url: imageUrl || null,
        expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
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
        <a href="/seller" className="text-sm font-semibold text-slate-700">
          ← Back to Seller Dashboard
        </a>

        <h1 className="mt-4 text-4xl font-bold">Edit Listing</h1>

        <form
          onSubmit={saveChanges}
          className="mt-8 space-y-5 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950"
          >
            <option value="">Select Category *</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity *"
            type="number"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Numeric Price, e.g. 100"
            type="number"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            placeholder="Price Text, e.g. $100 each, negotiable, contact for pricing"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Condition"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Brand"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City *"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950"
          >
            <option value="">Province / State *</option>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
            <label className="block text-sm font-bold text-slate-950">
              Inventory Image
            </label>

            <p className="mt-1 text-sm text-slate-600">
              Upload a new image or paste an image URL below.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadListingImage(file);
              }}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950"
            />

            {uploadingImage && (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Uploading image...
              </p>
            )}

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
              className="mt-4 w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
            />

            {imageUrl && (
              <div className="mt-4 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white">
                <img
                  src={imageUrl}
                  alt="Inventory preview"
                  className="h-full w-full object-contain p-2"
                />
              </div>
            )}
          </div>

          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950"
          />

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}