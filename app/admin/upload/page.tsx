"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { CATEGORIES } from "@/lib/categories";


type Company = {
  id: string;
  user_id: string;
  company_name: string;
  email: string | null;
};

export default function AdminUploadPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedSellerUserId, setSelectedSellerUserId] = useState("");
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAdminPage();
  }, []);

  async function loadAdminPage() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

    if (!allowedAdmins.includes(user.email || "")) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const { data } = await supabase
      .from("companies")
      .select("id, user_id, company_name, email")
      .order("company_name", { ascending: true });

    setCompanies((data || []) as Company[]);

    const params = new URLSearchParams(window.location.search);
    const sellerFromUrl = params.get("seller");

    if (sellerFromUrl) {
      setSelectedSellerUserId(sellerFromUrl);
    }

    setLoading(false);
  }

  function getDefaultExpiry() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  function getExpiryFromDateInput(dateValue: string) {
    return new Date(`${dateValue}T23:59:59`).toISOString();
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

  function getRowCategory(row: any) {
    return String(row.category || row.Category || "").trim();
  }

  function validateExcelCategories(rows: any[]) {
    return rows
      .map((row, index) => ({
        rowNumber: index + 2,
        category: getRowCategory(row),
      }))
      .filter((row) => !CATEGORIES.includes(row.category));
  }

  async function formatExcelRows(rows: any[], sellerUserId: string) {
    return await Promise.all(
      rows.map(async (row: any) => {
        const rawExpiry =
          row.expires_at || row.Expires_At || row.expiresAt || row.ExpiresAt;

        const rowCity = row.city || row.City || "";
        const rowProvince =
          row.province || row.Province || row.state || row.State || "";

        const rawPriceNote =
          row.price_note ||
          row.Price_Note ||
          row.priceNote ||
          row.PriceNote ||
          "";

        const coordinates = await getCoordinates(rowCity, rowProvince);

        return {
          user_id: sellerUserId,
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
  }

  async function downloadExcelTemplate() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "NorthStock";
    workbook.title = "NorthStock Admin Inventory Upload Template";

    const worksheet = workbook.addWorksheet("Inventory Template", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const categorySheet = workbook.addWorksheet("Allowed Categories", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      ["title", 32], ["category", 30], ["description", 44], ["quantity", 12],
      ["city", 20], ["province", 22], ["price", 14], ["price_note", 30],
      ["condition", 14], ["brand", 20], ["model", 18], ["sku", 18],
      ["image_url", 40], ["expires_at", 18],
    ].map(([header, width]) => ({ header: String(header), key: String(header), width: Number(width) }));

    const examples = CATEGORIES.map((category, index) => ({
      title: `Example ${category} Item`,
      category,
      description: `Example ${category.toLowerCase()} listing. Replace or delete this row.`,
      quantity: index + 2,
      city: index % 2 ? "Toronto" : "Vancouver",
      province: index % 2 ? "Ontario" : "British Columbia",
      price: 1000 + index * 250,
      price_note: index === 0 ? "Volume pricing available" : "",
      condition: index % 2 ? "New" : "Used",
      brand: "Example Brand",
      model: `MODEL-${index + 1}`,
      sku: `SAMPLE-${index + 1}`,
      image_url: "",
      expires_at: "",
    }));
    worksheet.addRows(examples);
    worksheet.autoFilter = "A1:N1";

    worksheet.getRow(1).height = 30;
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF020617" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
      });
    });

    categorySheet.columns = [{ header: "Allowed category", key: "category", width: 34 }];
    categorySheet.addRows(CATEGORIES.map((category) => ({ category })));
    categorySheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });
    for (let row = 2; row <= 500; row += 1) {
      worksheet.getCell(`B${row}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`'Allowed Categories'!$A$2:$A$${CATEGORIES.length + 1}`],
      };
      worksheet.getCell(`I${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"New,Used"'],
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "northstock-admin-upload-template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    setExcelRows(rows);
  }

  async function importForSeller() {
    if (!selectedSellerUserId) {
      alert("Please select a seller first.");
      return;
    }

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

    setUploading(true);

    const formattedRows = await formatExcelRows(excelRows, selectedSellerUserId);

    const { error } = await supabase.from("listings").insert(formattedRows);

    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`${formattedRows.length} listings uploaded for seller.`);
    setExcelRows([]);
  }

  async function replaceSellerInventory() {
    if (!selectedSellerUserId) {
      alert("Please select a seller first.");
      return;
    }

    if (excelRows.length === 0) {
      alert("Please upload an Excel file first.");
      return;
    }

    if (
      !confirm(
        "This will delete ALL listings for the selected seller and replace them with this Excel file. Continue?"
      )
    ) {
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

    setUploading(true);

    const deleteResult = await supabase
      .from("listings")
      .delete()
      .eq("user_id", selectedSellerUserId);

    if (deleteResult.error) {
      setUploading(false);
      alert(deleteResult.error.message);
      return;
    }

    const formattedRows = await formatExcelRows(excelRows, selectedSellerUserId);

    const insertResult = await supabase.from("listings").insert(formattedRows);

    setUploading(false);

    if (insertResult.error) {
      alert(insertResult.error.message);
      return;
    }

    alert(`${formattedRows.length} listings uploaded and seller inventory replaced.`);
    setExcelRows([]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading admin upload...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="mt-2 text-slate-700">
          You do not have permission to view this page.
        </p>
      </main>
    );
  }

  const selectedCompany = companies.find(
    (company) => company.user_id === selectedSellerUserId
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <a href="/admin" className="text-sm font-bold text-slate-950">
          ← Back to Admin
        </a>

        <h1 className="mt-4 text-4xl font-bold">
          Upload Inventory For Seller
        </h1>

        <p className="mt-3 text-slate-700">
          Select a seller/company, upload an Excel file, and import inventory
          directly into that seller’s account.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <label className="block text-sm font-bold text-slate-950">
            Select Seller
          </label>

          <select
            value={selectedSellerUserId}
            onChange={(e) => setSelectedSellerUserId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-300 p-4 text-slate-950"
          >
            <option value="">Choose seller/company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.user_id}>
                {company.company_name}
                {company.email ? ` — ${company.email}` : ""}
              </option>
            ))}
          </select>

          {selectedCompany && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
              Selected seller:{" "}
              <strong>{selectedCompany.company_name}</strong>
              {selectedCompany.email ? ` — ${selectedCompany.email}` : ""}
            </div>
          )}

          <button
            onClick={downloadExcelTemplate}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-4 font-semibold text-slate-950"
          >
            Download Excel Template
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
            onClick={importForSeller}
            disabled={uploading || excelRows.length === 0 || !selectedSellerUserId}
            className="mt-5 w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Import Listings For Seller"}
          </button>

          <button
            onClick={replaceSellerInventory}
            disabled={uploading || excelRows.length === 0 || !selectedSellerUserId}
            className="mt-3 w-full rounded-xl bg-red-600 py-4 font-semibold text-white disabled:opacity-50"
          >
            Replace Selected Seller Inventory
          </button>
        </div>
      </section>
    </main>
  );
}
