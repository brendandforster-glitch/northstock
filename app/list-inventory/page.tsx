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
  const [priceNote, setPriceNote] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const getCoordinates = async (cityValue: string, provinceValue: string) => {
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
  };

  const uploadListingImage = async (file: File) => {
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
  };

  const formatExcelRows = async (rows: any[], userId: string) => {
    const formattedRows = await Promise.all(
      rows.map(async (row: any) => {
        const rawExpiry =
          row.expires_at || row.Expires_At || row.expiresAt || row.ExpiresAt;

        const rowCity = row.city || row.City || "";
        const rowProvince =
          row.province || row.Province || row.state || row.State || "";

        const coordinates = await getCoordinates(rowCity, rowProvince);

        const rawPriceNote =
          row.price_note ||
          row.Price_Note ||
          row.priceNote ||
          row.PriceNote ||
          "";

        return {
          user_id: userId,
          title: row.title || row.Title || "",
          category: row.category || row.Category || "",
          description: row.description || row.Description || "",
          quantity: Number(row.quantity || row.Quantity || 0),
          city: rowCity,
          province: rowProvince,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          price: row.price || row.Price ? Number(row.price || row.Price) : null,
          price_note: rawPriceNote || null,
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
      })
    );

    return formattedRows;
  };

  const downloadExcelTemplate = () => {
    const template = [
      {
        title: "Example Office Chair",
        category: "Office Furniture",
        description: "Used ergonomic office chair in good condition.",
        quantity: 10,
        city: "Vancouver",
        province: "British Columbia",
        price: 100,
        price_note: "$100 each or bulk pricing available",
        condition: "Used",
        brand: "Herman Miller",
        model: "Aeron",
        sku: "CHAIR-001",
        image_url: "https://example.com/image.jpg",
        expires_at: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "NorthStock Template");
    XLSX.writeFile(workbook, "northstock-inventory-template.xlsx");
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

    const coordinates = await getCoordinates(city, province);

    const { error } = await supabase.from("listings").insert([
      {
        user_id: user.id,
        title,
        category,
        description,
        quantity: Number(quantity),
        city,
        province,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        price: price ? Number(price) : null,
        price_note: priceNote || null,
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

    if (!coordinates.latitude || !coordinates.longitude) {
      alert(
        "Inventory listing added successfully, but no coordinates were found for this city. Radius search may not include this listing until the city is added to the coordinate table."
      );
    } else {
      alert("Inventory listing added successfully.");
    }

    setTitle("");
    setCategory("");
    setDescription("");
    setQuantity("");
    setCity("");
    setProvince("");
    setPrice("");
    setPriceNote("");
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

    setUploadingExcel(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in.");
      setUploadingExcel(false);
      return;
    }

    const formattedRows = await formatExcelRows(excelRows, user.id);

    const { error } = await supabase.from("listings").insert(formattedRows);

    setUploadingExcel(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`${formattedRows.length} listings imported successfully.`);
    setExcelRows([]);
  };

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

    const formattedRows = await formatExcelRows(excelRows, user.id);

    const insertResult = await supabase.from("listings").insert(formattedRows);

    setUploadingExcel(false);

    if (insertResult.error) {
      alert(insertResult.error.message);
      return;
    }

    alert(`${formattedRows.length} listings imported and inventory replaced successfully.`);
    setExcelRows([]);
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

            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Numeric Price, e.g. 100" type="number" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={priceNote} onChange={(e) => setPriceNote(e.target.value)} placeholder="Price Text, e.g. $100 each, negotiable, contact for pricing" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500 md:col-span-2" />

            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City *" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Province / State *</option>
              {regions.map((item) => <option key={item}>{item}</option>)}
            </select>

            <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Condition" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-950">
                Inventory Image
              </label>

              <p className="mt-1 text-sm text-slate-600">
                Upload an image or paste an image URL below.
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

            <button type="submit" disabled={submittingListing || uploadingImage} className="rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50 md:col-span-2">
              {submittingListing ? "Adding Listing..." : "Add Inventory Listing"}
            </button>
          </form>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Bulk Upload with Excel</h2>

          <p className="mt-3 text-slate-700">
            Your Excel file should include columns: title, category, description, quantity, city,
            province, price, price_note, condition, brand, model, sku, image_url, expires_at.
            The expires_at column is optional. Leave it blank to use the default 30-day expiry.
          </p>

          <button
            onClick={downloadExcelTemplate}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-4 font-semibold text-slate-950"
          >
            Download NorthStock Excel Template
          </button>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="mt-5 w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-950"
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