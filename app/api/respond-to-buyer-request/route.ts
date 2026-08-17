import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return NextResponse.json(
        { error: "Required server configuration is missing." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be logged in to respond." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length);

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid or has expired." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const requestId =
      typeof body.requestId === "string"
        ? body.requestId.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const priceQuote =
      typeof body.priceQuote === "string"
        ? body.priceQuote.trim()
        : "";

    const availability =
      typeof body.availability === "string"
        ? body.availability.trim()
        : "";

    const submittedCompanyName =
      typeof body.companyName === "string"
        ? body.companyName.trim()
        : "";

    if (!requestId || !message) {
      return NextResponse.json(
        { error: "Request ID and response message are required." },
        { status: 400 }
      );
    }

    if (message.length > 3000) {
      return NextResponse.json(
        { error: "Your response must be 3,000 characters or fewer." },
        { status: 400 }
      );
    }

    const {
      data: buyerRequest,
      error: buyerRequestError,
    } = await supabaseAdmin
      .from("buyer_requests")
      .select(
        "id, user_id, title, status, fulfilled, expires_at"
      )
      .eq("id", requestId)
      .single();

    if (buyerRequestError || !buyerRequest) {
      return NextResponse.json(
        { error: "Buyer request not found." },
        { status: 404 }
      );
    }

    if (buyerRequest.user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot respond to your own buyer request." },
        { status: 403 }
      );
    }

    const hasExpired =
      new Date(buyerRequest.expires_at).getTime() <= Date.now();

    if (
      buyerRequest.status !== "active" ||
      buyerRequest.fulfilled ||
      hasExpired
    ) {
      return NextResponse.json(
        { error: "This buyer request is no longer accepting responses." },
        { status: 400 }
      );
    }

    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const companyName =
      submittedCompanyName ||
      companies?.[0]?.company_name ||
      "NorthStock Seller";

    const {
      data: savedResponse,
      error: responseError,
    } = await supabaseAdmin
      .from("buyer_request_responses")
      .insert({
        request_id: requestId,
        seller_user_id: user.id,
        company_name: companyName,
        message,
        price_quote: priceQuote || null,
        availability: availability || null,
      })
      .select("id")
      .single();

    if (responseError) {
      if (responseError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Your company has already responded to this buyer request.",
          },
          { status: 409 }
        );
      }

      console.error("Buyer response insert error:", responseError);

      return NextResponse.json(
        { error: "The response could not be saved." },
        { status: 500 }
      );
    }

    const {
      data: buyerUser,
      error: buyerUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      buyerRequest.user_id
    );

    if (buyerUserError || !buyerUser.user?.email) {
      console.error("Buyer email lookup error:", buyerUserError);

      return NextResponse.json({
        success: true,
        responseId: savedResponse.id,
        notificationSent: false,
      });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://northstock.ca";

    const safeTitle = escapeHtml(buyerRequest.title);
    const safeCompany = escapeHtml(companyName);
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
    const safePrice = escapeHtml(priceQuote || "Not specified");
    const safeAvailability = escapeHtml(
      availability || "Not specified"
    );

    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: "NorthStock <info@northstock.ca>",
      to: buyerUser.user.email,
      subject: `New response to your NorthStock request: ${buyerRequest.title}`,
      ...(user.email ? { replyTo: user.email } : {}),
      html: `
        <div style="background:#f1f5f9;padding:32px;font-family:Arial,sans-serif;color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:18px;overflow:hidden;">
            <div style="background:#020617;padding:28px;color:#ffffff;">
              <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:bold;text-transform:uppercase;">
                New Buyer Request Response
              </p>

              <h1 style="margin:0;font-size:26px;line-height:1.3;">
                ${safeTitle}
              </h1>
            </div>

            <div style="padding:28px;">
              <p style="margin:0 0 20px;font-size:17px;line-height:1.6;">
                <strong>${safeCompany}</strong> responded to your NorthStock buyer request.
              </p>

              <div style="background:#f8fafc;border-radius:12px;padding:18px;margin-bottom:18px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#64748b;">
                  Price or Quote
                </p>

                <p style="margin:0;font-weight:bold;">
                  ${safePrice}
                </p>
              </div>

              <div style="background:#f8fafc;border-radius:12px;padding:18px;margin-bottom:18px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#64748b;">
                  Availability
                </p>

                <p style="margin:0;font-weight:bold;">
                  ${safeAvailability}
                </p>
              </div>

              <div style="border:1px solid #cbd5e1;border-radius:12px;padding:18px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#64748b;">
                  Seller Message
                </p>

                <p style="margin:0;line-height:1.7;">
                  ${safeMessage}
                </p>
              </div>

              <p style="margin:22px 0 0;line-height:1.6;color:#475569;">
                Reply directly to this email to contact the responding seller.
              </p>

              <a
                href="${siteUrl}/buyer-requests/${buyerRequest.id}"
                style="display:inline-block;margin-top:22px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:10px;"
              >
                View Your Buyer Request
              </a>
            </div>

            <div style="border-top:1px solid #e2e8f0;padding:20px 28px;color:#64748b;font-size:13px;">
              NorthStock — North America’s Commercial Inventory Marketplace
            </div>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Buyer notification error:", emailError);

      return NextResponse.json({
        success: true,
        responseId: savedResponse.id,
        notificationSent: false,
      });
    }

    return NextResponse.json({
      success: true,
      responseId: savedResponse.id,
      notificationSent: true,
    });
  } catch (error) {
    console.error("Buyer response route error:", error);

    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}