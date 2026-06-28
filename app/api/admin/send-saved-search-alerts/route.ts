import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

type SavedSearch = {
  id: string;
  user_id: string;
  name: string | null;
  category: string | null;
  city: string | null;
  province: string | null;
  radius_km: number | null;
  keyword: string | null;
  email_alerts_enabled: boolean | null;
};

type Listing = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  province: string | null;
  price: number | null;
  price_note: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  description: string | null;
};

export async function POST(request: Request) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user?.email || !allowedAdmins.includes(user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: searches, error: searchError } = await supabaseAdmin
    .from("saved_searches")
    .select("id, user_id, name, category, city, province, radius_km, keyword, email_alerts_enabled")
    .eq("email_alerts_enabled", true);

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 });
  }

  const { data: listings, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("id, title, category, city, province, price, price_note, condition, brand, model, sku, description")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }

  let sentCount = 0;
  let matchCount = 0;

  for (const search of (searches || []) as SavedSearch[]) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      search.user_id
    );

    const email = authUser?.user?.email;

    if (!email) continue;

    const matchingListings = ((listings || []) as Listing[]).filter((listing) =>
      listingMatchesSearch(listing, search)
    );

    for (const listing of matchingListings) {
      matchCount++;

      const { data: alreadySent } = await supabaseAdmin
        .from("saved_search_alerts_sent")
        .select("id")
        .eq("saved_search_id", search.id)
        .eq("listing_id", listing.id)
        .maybeSingle();

      if (alreadySent) continue;

      const listingUrl = `https://www.northstock.ca/listings/${listing.id}`;
      const unsubscribeUrl = `https://www.northstock.ca/saved-searches`;

      await resend.emails.send({
        from: "NorthStock <info@northstock.ca>",
        to: email,
        subject: `New NorthStock listing match: ${listing.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2>New inventory matching your saved search</h2>

            <p>A new listing matches your saved search: <strong>${escapeHtml(
              search.name || "Saved Search"
            )}</strong></p>

            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${escapeHtml(listing.title)}</h3>
              <p><strong>Category:</strong> ${escapeHtml(listing.category || "Not listed")}</p>
              <p><strong>Condition:</strong> ${escapeHtml(listing.condition || "Not listed")}</p>
              <p><strong>Location:</strong> ${escapeHtml(listing.city || "")}${listing.province ? ", " + escapeHtml(listing.province) : ""}</p>
              <p><strong>Price:</strong> ${escapeHtml(formatPrice(listing.price, listing.price_note))}</p>
            </div>

            <p>
              <a href="${listingUrl}" style="display:inline-block;background:#020617;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
                View Listing
              </a>
            </p>

            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;" />

            <p style="font-size: 12px; color: #64748b;">
              You are receiving this because saved search email alerts are enabled on your NorthStock account.
              You can manage saved search alerts here:
              <a href="${unsubscribeUrl}">Saved Searches</a>
            </p>
          </div>
        `,
      });

      await supabaseAdmin.from("saved_search_alerts_sent").insert([
        {
          saved_search_id: search.id,
          listing_id: listing.id,
          user_id: search.user_id,
          email,
        },
      ]);

      sentCount++;
    }
  }

  return NextResponse.json({
    success: true,
    searches_checked: searches?.length || 0,
    listings_checked: listings?.length || 0,
    matches_found: matchCount,
    alerts_sent: sentCount,
  });
}

function listingMatchesSearch(listing: Listing, search: SavedSearch) {
  if (search.category && listing.category !== search.category) {
    return false;
  }

  if (search.province && listing.province !== search.province) {
    return false;
  }

  if (
    search.city &&
    listing.city &&
    listing.city.toLowerCase() !== search.city.toLowerCase()
  ) {
    return false;
  }

  if (search.keyword) {
    const keyword = search.keyword.toLowerCase().trim();

    const searchableText = [
      listing.title,
      listing.category,
      listing.condition,
      listing.brand,
      listing.model,
      listing.sku,
      listing.description,
      listing.city,
      listing.province,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(keyword)) {
      return false;
    }
  }

  return true;
}

function formatPrice(price: number | null, priceNote: string | null) {
  if (priceNote) return priceNote;
  if (price === null || price === undefined) return "Contact for pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}