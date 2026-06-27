import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

export async function POST(request: Request) {
  const body = await request.json();

  const {
    accessToken,
    audience,
    subject,
    body: emailBody,
    testOnly,
    testEmail,
  } = body;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  if (!subject || !emailBody) {
    return NextResponse.json(
      { error: "Subject and email body are required." },
      { status: 400 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user?.email || !allowedAdmins.includes(user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const recipients = testOnly
    ? [{ email: testEmail }]
    : await getRecipients(audience);

  if (!recipients || recipients.length === 0) {
    return NextResponse.json(
      { error: "No subscribed recipients found." },
      { status: 400 }
    );
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("email_campaigns")
    .insert([
      {
        subject,
        body: emailBody,
        audience: testOnly ? "test" : audience,
        status: "sending",
        sent_count: 0,
      },
    ])
    .select("id")
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: campaignError?.message || "Campaign creation failed." },
      { status: 500 }
    );
  }

  let sentCount = 0;

  for (const recipient of recipients) {
    try {
      const unsubscribeUrl = `https://www.northstock.ca/unsubscribe?email=${encodeURIComponent(
        recipient.email
      )}`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          ${emailBody
            .split("\n")
            .map((line: string) => `<p>${escapeHtml(line)}</p>`)
            .join("")}

          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;" />

          <p style="font-size: 12px; color: #64748b;">
            NorthStock<br/>
            You are receiving this because you are a NorthStock member.
          </p>

          <p style="font-size: 12px;">
            <a href="${unsubscribeUrl}" style="color: #2563eb;">Unsubscribe</a>
          </p>
        </div>
      `;

      await resend.emails.send({
        from: "NorthStock <info@northstock.ca>",
        to: recipient.email,
        subject,
        html,
      });

      sentCount++;

      await supabaseAdmin.from("email_campaign_recipients").insert([
        {
          campaign_id: campaign.id,
          email: recipient.email,
          status: "sent",
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      await supabaseAdmin.from("email_campaign_recipients").insert([
        {
          campaign_id: campaign.id,
          email: recipient.email,
          status: "failed",
          error: error?.message || "Unknown send error",
        },
      ]);
    }
  }

  await supabaseAdmin
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  return NextResponse.json({
    success: true,
    sent: sentCount,
  });
}

async function getRecipients(audience: string) {
  let query = supabaseAdmin
    .from("email_subscribers")
    .select("email")
    .eq("subscribed", true);

  if (audience && audience !== "all") {
    query = query.eq("audience", audience);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data || [];
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}