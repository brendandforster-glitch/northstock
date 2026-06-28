import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const allowedAdmins = ["brendandforster@gmail.com", "info@northstock.ca"];

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

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    companies,
    activeListings,
    quoteRequests,
    savedSearches,
    alertsSent,
    subscribers,
    todaysListings,
    companiesThisMonth,
    listingsThisMonth,
    quoteRequestsThisMonth,
    recentCompanies,
    recentListings,
    recentLeads,
  ] = await Promise.all([
    supabaseAdmin.from("companies").select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gt("expires_at", now.toISOString()),

    supabaseAdmin.from("leads").select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("saved_searches")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("saved_search_alerts_sent")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("email_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("subscribed", true),

    supabaseAdmin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),

    supabaseAdmin
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),

    supabaseAdmin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),

    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),

    supabaseAdmin
      .from("companies")
      .select("id, company_name, city, province, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabaseAdmin
      .from("listings")
      .select("id, title, category, city, province, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabaseAdmin
      .from("leads")
      .select("id, buyer_email, listing_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 10000,
});

const totalUsers = authUsers?.users?.length || 0;

  return NextResponse.json({
    stats: {
      companies: companies.count || 0,
      users: totalUsers,
      activeListings: activeListings.count || 0,
      quoteRequests: quoteRequests.count || 0,
      savedSearches: savedSearches.count || 0,
      alertsSent: alertsSent.count || 0,
      newsletterSubscribers: subscribers.count || 0,
      todaysListings: todaysListings.count || 0,
    },
    growth: {
      companiesThisMonth: companiesThisMonth.count || 0,
      listingsThisMonth: listingsThisMonth.count || 0,
      quoteRequestsThisMonth: quoteRequestsThisMonth.count || 0,
    },
    recent: {
      companies: recentCompanies.data || [],
      listings: recentListings.data || [],
      quoteRequests: recentLeads.data || [],
    },
  });
}