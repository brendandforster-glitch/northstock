import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: listings, error } = await supabaseAdmin
    .from("listings")
    .select(
      "title, category, quantity, condition, price, price_note, city, province, brand, model, sku, description, image_url, status, expires_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (listings || []).map((item) => ({
    Title: item.title || "",
    Category: item.category || "",
    Quantity: item.quantity || 0,
    Condition: item.condition || "",
    Price: item.price ?? "",
    "Price Note": item.price_note || "",
    City: item.city || "",
    "Province / State": item.province || "",
    Brand: item.brand || "",
    Model: item.model || "",
    SKU: item.sku || "",
    Description: item.description || "",
    "Image URL": item.image_url || "",
    Status: item.status || "",
    "Expires At": item.expires_at || "",
    "Created At": item.created_at || "",
  }));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NorthStock";
  workbook.company = "NorthStock";
  workbook.title = "NorthStock Inventory Export";

  const worksheet = workbook.addWorksheet("Inventory", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = Object.keys(rows[0] || {
    Title: "", Category: "", Quantity: "", Condition: "", Price: "",
    "Price Note": "", City: "", "Province / State": "", Brand: "",
    Model: "", SKU: "", Description: "", "Image URL": "", Status: "",
    "Expires At": "", "Created At": "",
  });

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(48, Math.max(14, header.length + 4)),
  }));
  worksheet.getColumn("Description").width = 44;
  worksheet.getColumn("Image URL").width = 42;
  worksheet.addRows(rows);
  worksheet.autoFilter = `A1:${worksheet.getColumn(headers.length).letter}1`;
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
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="northstock-inventory.xlsx"`,
    },
  });
}
