import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();

  const {
    accessToken,
    mode,
    companyId,
    companyName,
    contactName,
    email,
    phone,
    website,
    city,
    province,
  } = body;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (!companyName || !email) {
    return NextResponse.json(
      { error: "Company name and email are required." },
      { status: 400 }
    );
  }

  let finalCompanyId = companyId;

  if (mode === "new") {
    const { data: newCompany, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert([
        {
          company_name: companyName,
          email,
          phone: phone || "",
          website: website || "",
          city: city || "",
          province: province || "",
          description: "",
          logo_url: "",
          user_id: null,
        },
      ])
      .select("id")
      .single();

    if (companyError || !newCompany) {
      return NextResponse.json(
        { error: companyError?.message || "Could not create company." },
        { status: 500 }
      );
    }

    finalCompanyId = newCompany.id;
  }

  if (!finalCompanyId) {
    return NextResponse.json({ error: "Missing company ID." }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://northstock.ca";
  const inviteLink = `${siteUrl}/invite/${token}`;

  const { error: inviteError } = await supabaseAdmin
    .from("seller_invites")
    .insert([
      {
        company_id: finalCompanyId,
        company_name: companyName,
        contact_name: contactName || null,
        email,
        token,
        status: "pending",
      },
    ]);

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const greeting = contactName ? `Hello ${contactName},` : "Hello,";

  const { error: emailError } = await resend.emails.send({
    from: "NorthStock <info@northstock.ca>",
    to: email,
    subject: "You've Been Invited to Join NorthStock",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p>${greeting}</p>

        <p>
          Brendan Forster has invited you to join NorthStock and manage the company profile for
          <strong>${companyName}</strong>.
        </p>

        <p>
          NorthStock is a commercial inventory marketplace built for businesses across North America.
          Through your seller account, you can manage your company profile, inventory listings, and quote requests.
        </p>

        <p>
          Click the button below to create your free seller account and claim your company profile:
        </p>

        <p style="margin: 24px 0;">
          <a href="${inviteLink}" style="background:#020617;color:#ffffff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Create Seller Account
          </a>
        </p>

        <p>If the button does not work, copy and paste this link into your browser:</p>

        <p style="word-break: break-all;">
          ${inviteLink}
        </p>

        <p>
          Thank you,<br />
          Brendan Forster<br />
          Founder, NorthStock<br />
          info@northstock.ca<br />
          613-281-4203
        </p>
      </div>
    `,
  });

  if (emailError) {
    return NextResponse.json(
      {
        error: `Invite was created, but email failed: ${emailError.message}`,
        inviteLink,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    inviteLink,
    token,
    emailSent: true,
  });
}