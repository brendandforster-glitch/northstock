import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bearerToken, getUserFromToken } from "@/lib/server/auth";
import { cleanText, escapeHtml } from "@/lib/server/security";

type Listing = {
  id: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  description: string | null;
};

function matches(listing: Listing, search: Record<string, any>) {
  if (search.province && listing.province !== search.province) return false;
  if (search.city && !listing.city.toLowerCase().includes(String(search.city).toLowerCase())) return false;
  if (search.category && !String(search.category).split(",").map((v) => v.trim()).includes(listing.category)) return false;
  if (!search.keyword) return true;

  const haystack = [listing.title, listing.category, listing.city, listing.province, listing.brand, listing.model, listing.sku, listing.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(String(search.keyword).trim().toLowerCase());
}

export async function POST(request: Request) {
  try {
    const { admin, user } = await getUserFromToken(bearerToken(request));
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await request.json();
    const listingId = cleanText(body.listingId, 80);
    if (!listingId) return NextResponse.json({ error: "Missing listing ID." }, { status: 400 });

    const { data } = await admin
      .from("listings")
      .select("id, user_id, title, category, city, province, brand, model, sku, description, status, expires_at")
      .eq("id", listingId)
      .single();

    if (!data || data.user_id !== user.id) {
      return NextResponse.json({ error: "You do not own this listing." }, { status: 403 });
    }

    if (data.status !== "active" || new Date(data.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Listing is not active." }, { status: 400 });
    }

    const listing = data as Listing & { user_id: string };
    const { data: searches, error } = await admin
      .from("saved_searches")
      .select("id, user_id, name, category, city, province, keyword")
      .eq("email_alerts_enabled", true);

    if (error) throw error;
    const resendKey = process.env.RESEND_API_KEY;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://northstock.ca").replace(/\/$/, "");
    const resend = resendKey ? new Resend(resendKey) : null;
    let sent = 0;

    for (const search of (searches || []).filter((item) => matches(listing, item))) {
      const { data: prior } = await admin
        .from("saved_search_alerts_sent")
        .select("id")
        .eq("saved_search_id", search.id)
        .eq("listing_id", listing.id)
        .maybeSingle();
      if (prior) continue;

      const { data: authUser } = await admin.auth.admin.getUserById(search.user_id);
      const email = authUser.user?.email;
      if (!email || !resend) continue;

      const { error: emailError } = await resend.emails.send({
        from: "NorthStock <info@northstock.ca>",
        to: email,
        subject: `New NorthStock match: ${listing.title}`,
        text: `A new listing matches your saved search. View it at ${siteUrl}/listings/${listing.id}`,
        html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>New saved-search match</h2><p><strong>${escapeHtml(
          listing.title
        )}</strong> matches ${escapeHtml(search.name || "your saved search")}.</p><p>${escapeHtml(
          [listing.city, listing.province].filter(Boolean).join(", ")
        )}</p><p><a href="${siteUrl}/listings/${listing.id}">View listing</a></p><p style="font-size:12px;color:#64748b">Manage alerts in <a href="${siteUrl}/saved-searches">Saved Searches</a>.</p></div>`,
      });

      if (emailError) continue;
      await admin.from("saved_search_alerts_sent").insert({
        saved_search_id: search.id,
        listing_id: listing.id,
        user_id: search.user_id,
        email,
      });
      sent += 1;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Saved-search alert error:", error);
    return NextResponse.json({ error: "Alerts could not be processed." }, { status: 500 });
  }
}
