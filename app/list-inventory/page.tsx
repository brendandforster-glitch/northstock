"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

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

export default function ListInventoryPage() {
  const [authChecking, setAuthChecking] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestCategory, setRequestCategory] = useState("");
  const [inventorySize, setInventorySize] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);

  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/login");
        return;
      }

      setAuthChecking(false);
    }

    checkUser();
  }, []);

  const getDefaultExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  };

  const getExpiryFromDateInput = (dateValue: string) => {
    return new Date(`${dateValue}T23:59:59`).toISOString();
  };

  const handleSellerRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !contactName || !email) {
      alert("Please complete all required fields.");
      return;
    }

    setSubmittingRequest(true);

    const { error } = await supabase.from("seller_requests").insert([
      {
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        category: requestCategory,
        inventory_size: inventorySize,
        notes,
      },
    ]);

    setSubmittingRequest(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Inventory request submitted successfully.");

    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setRequestCategory("");
    setInventorySize("");
    setNotes("");
  };

  const handleManualListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !quantity || !city || !province) {
      alert("Please complete title, category, quantity, city, and province/state.");
      return;
    }

    setSubmittingListing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in.");
      setSubmittingListing(false);
      return;
    }

    const { error } = await supabase.from("listings").insert([
      {
        user_id: user.id,
        title,
        category,
        description,
        quantity: Number(quantity),
        city,
        province,
        price: price ? Number(price) : null,
        condition,
        brand,
        model,
        sku,
        image_url: imageUrl || null,
        status: "active",
        expires_at: expiresAt
          ? getExpiryFromDateInput(expiresAt)
          : getDefaultExpiry(),
      },
    ]);

    setSubmittingListing(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Inventory listing added successfully.");

    setTitle("");
    setCategory("");
    setDescription("");
    setQuantity("");
    setCity("");
    setProvince("");
    setPrice("");
    setCondition("");
    setBrand("");
    setModel("");
    setSku("");
    setImageUrl("");
    setExpiresAt("");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    setExcelRows(rows);
  };

  const importExcelRows = async () => {
    if (excelRows.length === 0) {
      alert("Please upload an Excel file first.");
      return;
    }
    const replaceAllInventory = async () => {
  if (excelRows.length === 0) {
    alert("Please upload an Excel file first.");
    return;
  }

  if (
    !confirm(
      "This will delete ALL of your current listings and replace them with the uploaded Excel file. Continue?"
    )
  ) {
    return;
  }

  setUploadingExcel(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in.");
    setUploadingExcel(false);
    return;
  }

  const deleteResult = await supabase
    .from("listings")
    .delete()
    .eq("user_id", user.id);

  if (deleteResult.error) {
    alert(deleteResult.error.message);
    setUploadingExcel(false);
    return;
  }

  const formattedRows = excelRows.map((row: any) => {
    const rawExpiry =
      row.expires_at ||
      row.Expires_At ||
      row.expiresAt ||
      row.ExpiresAt;

    return {
      user_id: user.id,
      title: row.title || row.Title || "",
      category: row.category || row.Category || "",
      description: row.description || row.Description || "",
      quantity: Number(row.quantity || row.Quantity || 0),
      city: row.city || row.City || "",
      province:
        row.province ||
        row.Province ||
        row.state ||
        row.State ||
        "",
      price:
        row.price || row.Price
          ? Number(row.price || row.Price)
          : null,
      condition: row.condition || row.Condition || "",
      brand: row.brand || row.Brand || "",
      model: row.model || row.Model || "",
      sku: row.sku || row.SKU || "",
      image_url:
        row.image_url ||
        row.Image_URL ||
        row.imageUrl ||
        row.ImageUrl ||
        null,
      status: "active",
      expires_at: rawExpiry
        ? getExpiryFromDateInput(String(rawExpiry))
        : getDefaultExpiry(),
    };
  });

  const insertResult = await supabase
    .from("listings")
    .insert(formattedRows);

  setUploadingExcel(false);

  if (insertResult.error) {
    alert(insertResult.error.message);
    return;
  }

  alert(
    `${formattedRows.length} listings imported and inventory replaced successfully.`
  );

  setExcelRows([]);
};

    setUploadingExcel(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in.");
      setUploadingExcel(false);
      return;
    }

    const formattedRows = excelRows.map((row: any) => {
      const rawExpiry = row.expires_at || row.Expires_At || row.expiresAt || row.ExpiresAt;

      return {
        user_id: user.id,
        title: row.title || row.Title || "",
        category: row.category || row.Category || "",
        description: row.description || row.Description || "",
        quantity: Number(row.quantity || row.Quantity || 0),
        city: row.city || row.City || "",
        province: row.province || row.Province || row.state || row.State || "",
        price: row.price || row.Price ? Number(row.price || row.Price) : null,
        condition: row.condition || row.Condition || "",
        brand: row.brand || row.Brand || "",
        model: row.model || row.Model || "",
        sku: row.sku || row.SKU || "",
        image_url:
          row.image_url ||
          row.Image_URL ||
          row.imageUrl ||
          row.ImageUrl ||
          null,
        status: "active",
        expires_at: rawExpiry
          ? getExpiryFromDateInput(String(rawExpiry))
          : getDefaultExpiry(),
      };
    });

    const { error } = await supabase.from("listings").insert(formattedRows);

    setUploadingExcel(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`${formattedRows.length} listings imported successfully.`);
    setExcelRows([]);
  };const replaceAllInventory = async () => {
  if (excelRows.length === 0) {
    alert("Please upload an Excel file first.");
    return;
  }

  if (
    !confirm(
      "This will delete ALL of your current listings and replace them with the uploaded Excel file. Continue?"
    )
  ) {
    return;
  }

  setUploadingExcel(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in.");
    setUploadingExcel(false);
    return;
  }

  const deleteResult = await supabase
    .from("listings")
    .delete()
    .eq("user_id", user.id);

  if (deleteResult.error) {
    alert(deleteResult.error.message);
    setUploadingExcel(false);
    return;
  }

  await importExcelRows();
};

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-6">
        <p className="text-slate-700 font-semibold">Checking login status...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-bold">List Your Inventory</h1>

        <p className="mt-3 text-slate-700">
          Add inventory directly to NorthStock or submit a request for help uploading.
        </p>

        <section className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Add Inventory One-by-One</h2>

          <form onSubmit={handleManualListingSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Select Category *</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>

            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity *" type="number" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City *" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Province / State *</option>
              {regions.map((item) => <option key={item}>{item}</option>)}
            </select>

            <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Condition" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500 md:col-span-2" />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Optional Expiry Date
              </label>
              <p className="mb-3 text-sm text-slate-600">
                Leave blank and NorthStock will automatically expire this listing after 30 days.
              </p>
              <input
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                type="date"
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-950"
              />
            </div>

            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500 md:col-span-2" />

            <button type="submit" disabled={submittingListing} className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50 md:col-span-2">
              {submittingListing ? "Adding Listing..." : "Add Inventory Listing"}
            </button>
          </form>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Bulk Upload with Excel</h2>

          <p className="mt-3 text-slate-700">
            Your Excel file should include columns: title, category, description, quantity, city,
            province, price, condition, brand, model, sku, image_url, expires_at.
            The expires_at column is optional. Leave it blank to use the default 30-day expiry.
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-950"
          />

          {excelRows.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-700">
              {excelRows.length} rows ready to import.
            </div>
          )}

         <button
  onClick={importExcelRows}
  disabled={uploadingExcel || excelRows.length === 0}
  className="mt-5 w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
>
  {uploadingExcel ? "Importing..." : "Import Excel Listings"}
</button>

<button
  onClick={replaceAllInventory}
  disabled={uploadingExcel || excelRows.length === 0}
  className="mt-3 w-full rounded-xl bg-red-600 py-4 font-semibold text-white disabled:opacity-50"
>
  Replace All My Listings
</button>

</section>

        <section className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Need Help Uploading?</h2>

          <form onSubmit={handleSellerRequestSubmit} className="mt-6 space-y-5">
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name *" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name *" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={requestCategory} onChange={(e) => setRequestCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Select Category</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>

            <select value={inventorySize} onChange={(e) => setInventorySize(e.target.value)} className="w-full rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Estimated Inventory Size</option>
              <option>1-50 Items</option>
              <option>50-500 Items</option>
              <option>500-5000 Items</option>
              <option>5000+ Items</option>
            </select>

            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell us about your inventory..." className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <button type="submit" disabled={submittingRequest} className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50">
              {submittingRequest ? "Submitting..." : "Request Inventory Upload Help"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}