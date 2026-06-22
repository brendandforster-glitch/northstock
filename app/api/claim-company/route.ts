import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { accessToken } = body;

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

  const { data: claimedCompany, error: claimError } = await supabaseAdmin
    .from("companies")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .is("user_id", null)
    .select("id, company_name")
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  return NextResponse.json({
    claimed: !!claimedCompany,
    company: claimedCompany || null,
  });
}