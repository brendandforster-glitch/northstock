import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bearerToken, getUserFromToken } from "@/lib/server/auth";
import { cleanText, escapeHtml } from "@/lib/server/security";

export async function POST(request: Request) {
  try {
    const { admin, user } = await getUserFromToken(bearerToken(request));
    if (!user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const body = await request.json();
    const listingId = cleanText(body.listingId, 80);
    const buyerName = cleanText(body.buyerName, 120);
    const buyerPhone = cleanText(body.buyerPhone, 60);
    const buyerMessage = cleanText(body.buyerMessage, 3000);

    if (!listingId || !buyerName || buyerMessage.length < 10) {
      return NextResponse.json(
        { error: "Listing, name, and a message of at least 10 characters are required." },
        { status: 400 }
      );
    }

    const { data: listing } = await admin
      .from("listings")
      .select("id, user_id, title, status, expires_at")
      .eq("id", listingId)
      .single();

    if (
      !listing ||
      listing.status !== "active" ||
      !listing.expires_at ||
      new Date(listing.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json({ error: "This listing is no longer available." }, { status: 404 });
    }

    if (listing.user_id === user.id) {
      return NextResponse.json({ error: "You cannot request a quote on your own listing." }, { status: 403 });
    }

    const { data: company } = await admin
      .from("companies")
      .select("company_name, email")
      .eq("user_id", listing.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fullMessage = `Name: ${buyerName}\nEmail: ${user.email}\nPhone: ${
      buyerPhone || "Not provided"
    }\n\nMessage:\n${buyerMessage}`;

    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({ listing_id: listing.id, buyer_email: user.email, message: fullMessage })
      .select("id")
      .single();

    if (leadError || !lead) {
      console.error("Quote request insert error:", leadError);
      return NextResponse.json({ error: "The quote request could not be saved." }, { status: 500 });
    }

    const recipient = company?.email || "info@northstock.ca";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://northstock.ca").replace(/\/$/, "");
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      return NextResponse.json({ success: true, leadId: lead.id, notificationSent: false });
    }

    const resend = new Resend(resendKey);
    const { error: emailError } = await resend.emails.send({
      from: "NorthStock <info@northstock.ca>",
      to: recipient,
      cc: "info@northstock.ca",
      replyTo: user.email,
      subject: `New quote request: ${listing.title}`,
      text: `A buyer requested a quote for ${listing.title}.\n\n${fullMessage}\n\nView requests: ${siteUrl}/seller/leads`,
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>New Quote Request</h2><p><strong>Listing:</strong> ${escapeHtml(
        listing.title
      )}</p><p><strong>Buyer:</strong> ${escapeHtml(buyerName)}</p><p><strong>Email:</strong> ${escapeHtml(
        user.email
      )}</p><p><strong>Phone:</strong> ${escapeHtml(
        buyerPhone || "Not provided"
      )}</p><p><strong>Message:</strong></p><p>${escapeHtml(buyerMessage).replaceAll(
        "\n",
        "<br />"
      )}</p><p><a href="${siteUrl}/seller/leads">View Quote Requests</a></p></div>`,
    });

    if (emailError) console.error("Quote request email error:", emailError);
    return NextResponse.json({ success: true, leadId: lead.id, notificationSent: !emailError });
  } catch (error) {
    console.error("Quote request route error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
