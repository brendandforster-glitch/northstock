import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

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

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="northstock-inventory.xlsx"`,
    },
  });
}