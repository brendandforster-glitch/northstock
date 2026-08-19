"use client";

import { CATEGORIES } from "@/lib/categories";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";


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

  const getRowCategory = (row: any) => {
    return String(row.category || row.Category || "").trim();
  };

  const validateExcelCategories = (rows: any[]) => {
    const invalidRows = rows
      .map((row, index) => ({
        rowNumber: index + 2,
        category: getRowCategory(row),
      }))
      .filter((row) => !CATEGORIES.includes(row.category));

    return invalidRows;
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
          category: getRowCategory(row),
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

  const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "NorthStock";
  workbook.company = "NorthStock";
  workbook.subject = "Commercial Inventory Upload Template";
  workbook.title = "NorthStock Inventory Template";
  workbook.created = new Date();

  const inventorySheet = workbook.addWorksheet("Inventory Template", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const categorySheet = workbook.addWorksheet("Allowed Categories", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const instructionsSheet = workbook.addWorksheet("Instructions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  inventorySheet.columns = [
    { header: "title", key: "title", width: 34 },
    { header: "category", key: "category", width: 30 },
    { header: "description", key: "description", width: 48 },
    { header: "quantity", key: "quantity", width: 12 },
    { header: "city", key: "city", width: 20 },
    { header: "province", key: "province", width: 24 },
    { header: "price", key: "price", width: 14 },
    { header: "price_note", key: "price_note", width: 34 },
    { header: "condition", key: "condition", width: 14 },
    { header: "brand", key: "brand", width: 20 },
    { header: "model", key: "model", width: 18 },
    { header: "sku", key: "sku", width: 18 },
    { header: "image_url", key: "image_url", width: 45 },
    { header: "expires_at", key: "expires_at", width: 18 },
  ];

  const examples = [
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
    {
      title: "Example Commercial Range",
      category: "Restaurant Equipment",
      description: "Six-burner commercial gas range.",
      quantity: 2,
      city: "Toronto",
      province: "Ontario",
      price: 3500,
      price_note: "",
      condition: "Used",
      brand: "Example Brand",
      model: "RANGE-36",
      sku: "RANGE-001",
      image_url: "",
      expires_at: "",
    },
    {
      title: "Example Hotel Nightstand",
      category: "Hotel Supplies",
      description: "Commercial-grade guest-room nightstand.",
      quantity: 40,
      city: "Calgary",
      province: "Alberta",
      price: 125,
      price_note: "Volume pricing available",
      condition: "New",
      brand: "Example Brand",
      model: "NS-100",
      sku: "HOTEL-001",
      image_url: "",
      expires_at: "",
    },
    {
      title: "Example Commercial Treadmill",
      category: "Commercial Gym Equipment",
      description: "Commercial treadmill in working condition.",
      quantity: 4,
      city: "Seattle",
      province: "Washington",
      price: 2200,
      price_note: "",
      condition: "Used",
      brand: "Example Fitness",
      model: "T-900",
      sku: "GYM-001",
      image_url: "",
      expires_at: "",
    },
  ];

  inventorySheet.addRows(examples);
  inventorySheet.autoFilter = "A1:N1";
  inventorySheet.getRow(1).height = 30;

  inventorySheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF020617" },
    };

    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    cell.border = {
      bottom: {
        style: "medium",
        color: { argb: "FF2563EB" },
      },
    };
  });

  inventorySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 24;

      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEFF6FF" },
          };
        });
      }

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          bottom: {
            style: "thin",
            color: { argb: "FFD8DEE9" },
          },
        };
      });
    }
  });

  inventorySheet.getColumn("price").numFmt = "$#,##0.00";
  inventorySheet.getColumn("quantity").numFmt = "0";

  for (let rowNumber = 2; rowNumber <= 1000; rowNumber += 1) {
    inventorySheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ["'Allowed Categories'!$A$2:$A$5"],
      showErrorMessage: true,
      errorTitle: "Invalid category",
      error:
        "Select a category from the dropdown. Category names must match exactly.",
    };

    inventorySheet.getCell(`I${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"New,Used,Refurbished"'],
      showErrorMessage: true,
      errorTitle: "Invalid condition",
      error: "Select New, Used, or Refurbished.",
    };

    inventorySheet.getCell(`D${rowNumber}`).dataValidation = {
      type: "whole",
      operator: "greaterThan",
      formulae: [0],
      allowBlank: false,
      showErrorMessage: true,
      errorTitle: "Invalid quantity",
      error: "Quantity must be a whole number greater than zero.",
    };
  }

  categorySheet.columns = [
    { header: "Approved NorthStock Categories", key: "category", width: 36 },
    { header: "Examples", key: "examples", width: 65 },
  ];

  categorySheet.addRows([
    {
      category: "Office Furniture",
      examples: "Desks, chairs, workstations, filing cabinets and storage",
    },
    {
      category: "Restaurant Equipment",
      examples: "Ranges, refrigeration, prep tables, sinks and ovens",
    },
    {
      category: "Hotel Supplies",
      examples: "Guest-room furniture, linens, fixtures and housekeeping equipment",
    },
    {
      category: "Commercial Gym Equipment",
      examples: "Cardio machines, strength equipment, weights and flooring",
    },
  ]);

 instructionsSheet.columns = [
  {
    header: "NorthStock Inventory Upload Instructions",
    key: "topic",
    width: 32,
  },
  {
    header: "Details",
    key: "details",
    width: 100,
  },
];

instructionsSheet.addRows([
  {
    topic: "Required fields",
    details: "title, category, quantity, city, and province",
  },
  {
    topic: "Category",
    details:
      "Choose an approved value from the category dropdown. Do not rename categories.",
  },
  {
    topic: "Price",
    details: "Enter numbers only. Do not include dollar signs or commas.",
  },
  {
    topic: "Price note",
    details:
      "Optional wording such as Contact for pricing, Negotiable, or Volume pricing available.",
  },
  {
    topic: "Image URL",
    details: "Optional direct public URL for the listing image.",
  },
  {
    topic: "Expiry date",
    details:
      "Optional. Leave blank to use NorthStock’s default 30-day listing period.",
  },
  {
    topic: "Important",
    details: "Delete the example rows before importing your real inventory.",
  },
  {
    topic: "Support",
    details:
      "Email info@northstock.ca if you would like help preparing your inventory file.",
  },
]);

  [categorySheet, instructionsSheet].forEach((sheet) => {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 2 },
    };

    sheet.getRow(1).height = 30;

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF020617" },
      };

      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 30;

        row.eachCell((cell) => {
          cell.alignment = {
            vertical: "middle",
            wrapText: true,
          };

          cell.border = {
            bottom: {
              style: "thin",
              color: { argb: "FFD8DEE9" },
            },
          };
        });
      }
    });
  });

    const buffer = await workbook.xlsx.writeBuffer();

  const bytes = new Uint8Array(buffer);

  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = "northstock-inventory-template.xlsx";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(downloadUrl);
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

    const { data: insertedListing, error } = await supabase
      .from("listings")
      .insert([
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
      ])
      .select()
      .single();

    setSubmittingListing(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (insertedListing) {
      const { data: sessionData } = await supabase.auth.getSession();
      await fetch("/api/send-saved-search-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          listingId: insertedListing.id,
        }),
      });
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

    const invalidRows = validateExcelCategories(excelRows);
    
    const allowedCategories = CATEGORIES.map((c) => `- ${c}`).join("\n");

    if (invalidRows.length > 0) {
      alert(
  `Invalid category detected.

Allowed categories:
${allowedCategories}

Invalid rows:
${invalidRows
  .map((row) => `Row ${row.rowNumber}: ${row.category || "Blank"}`)
  .join("\n")}`
);
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

    const invalidRows = validateExcelCategories(excelRows);
    const allowedCategories = CATEGORIES.map((c) => `- ${c}`).join("\n");

    if (invalidRows.length > 0) {
      alert(
  `Invalid category detected.

Allowed categories:
${allowedCategories}

Invalid rows:
${invalidRows
  .map((row) => `Row ${row.rowNumber}: ${row.category || "Blank"}`)
  .join("\n")}`
);
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
        <p className="text-slate-800 font-semibold">Checking login status...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-extrabold text-slate-950">
          List Your Inventory
        </h1>

        <p className="mt-3 text-slate-800">
          Add individual listings, upload inventory in bulk, or request help getting your inventory onto NorthStock.
        </p>

        <section className="mt-10 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-950">
            Add Individual Listings
          </h2>

          <p className="mt-2 text-slate-800">
            Use this section to add one item or inventory group at a time.
          </p>

          <form onSubmit={handleManualListingSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" className="rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Select Category *</option>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
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

              <p className="mt-1 text-sm text-slate-700">
                Upload an image directly or paste an image URL below.
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Choose Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadListingImage(file);
                  }}
                  className="hidden"
                />
              </label>

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
              <label className="mb-2 block text-sm font-bold text-slate-950">
                Optional Expiry Date
              </label>
              <p className="mb-3 text-sm text-slate-700">
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
          <h2 className="text-2xl font-extrabold text-slate-950">
            Bulk Upload with Excel
          </h2>

          <p className="mt-3 text-slate-800">
            Upload multiple listings at once using the NorthStock Excel template.
            Your category value must exactly match one of the four approved categories:
Office Furniture, Restaurant Equipment, Hotel Supplies, or Commercial Gym Equipment.
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Required columns: title, category, description, quantity, city, province, price, price_note, condition, brand, model, sku, image_url, expires_at.
            The expires_at column is optional. Leave it blank to use the default 30-day expiry.
          </p>

          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Need Image URLs for Your Spreadsheet?
            </p>

            <p className="mt-1 text-sm text-slate-700">
              Upload your images to{" "}
              <a
                href="https://postimages.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline"
              >
                PostImages
              </a>{" "}
              and paste each direct image URL into the <strong>image_url</strong> column of your Excel file.
            </p>
          </div>

          <button
            onClick={downloadExcelTemplate}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-4 font-semibold text-slate-950"
          >
            Download NorthStock Excel Template
          </button>

          <label className="mt-5 flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-4 font-semibold text-white hover:bg-slate-800">
            Choose Excel File
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>

          {excelRows.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-800">
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
          <h2 className="text-2xl font-extrabold text-slate-950">
            Need Help Uploading?
          </h2>

          <p className="mt-2 text-slate-800">
            If you have a large inventory file or need help getting started, send us your details and we can help with onboarding.
          </p>

          <form onSubmit={handleSellerRequestSubmit} className="mt-6 space-y-5">
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name *" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name *" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full rounded-xl border border-slate-300 p-4 text-slate-950 placeholder:text-slate-500" />

            <select value={requestCategory} onChange={(e) => setRequestCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 p-4 text-slate-950">
              <option value="">Select Category</option>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
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
