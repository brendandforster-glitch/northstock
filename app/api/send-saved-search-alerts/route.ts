import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ListingPayload = {
  listingId: string;
  title: string;
  category: string;
  city: string;
  province: string | null;
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
  description?: string | null;
};

function matchesKeyword(listing: ListingPayload, keyword: string | null) {
  if (!keyword) return true;

  const search = keyword.toLowerCase().trim();

  return [
    listing.title,
    listing.category,
    listing.city,
    listing.province,
    listing.brand,
    listing.model,
    listing.sku,
    listing.description,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(search));
}

export async function POST(request: Request) {
  try {
    const listing: ListingPayload = await request.json();

    if (!listing.listingId || !listing.title) {
      return Response.json(
        { data: null, error: "Missing listing data." },
        { status: 400 }
      );
    }

    const { data: savedSearches, error: searchError } = await supabaseAdmin
      .from("saved_searches")
      .select("*")
      .eq("email_alerts_enabled", true);

    if (searchError) {
      return Response.json(
        { data: null, error: searchError.message },
        { status: 500 }
      );
    }

    const matches = (savedSearches || []).filter((search) => {
      const keywordMatch = matchesKeyword(listing, search.keyword);

      const provinceMatch = search.province
        ? listing.province === search.province
        : true;

      const cityMatch = search.city
        ? listing.city.toLowerCase().includes(search.city.toLowerCase())
        : true;

      const categoryMatch = search.category
        ? search.category
            .split(",")
            .map((item: string) => item.trim())
            .includes(listing.category)
        : true;

      return keywordMatch && provinceMatch && cityMatch && categoryMatch;
    });

    if (matches.length === 0) {
      return Response.json({
        data: {
          sent: 0,
          message: "No saved searches matched this listing.",
        },
        error: null,
      });
    }

    let sent = 0;

    for (const match of matches) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
        match.user_id
      );

      const userEmail = userData?.user?.email;

      if (!userEmail) continue;

      await resend.emails.send({
        from: "NorthStock <info@northstock.ca>",
        to: [userEmail],
        subject: `New NorthStock Match: ${listing.title}`,
        html: `
          <h2>New Saved Search Match</h2>

          <p>A new listing matches one of your saved searches on NorthStock.</p>

          <p><strong>Listing:</strong> ${listing.title}</p>
          <p><strong>Category:</strong> ${listing.category}</p>
          <p><strong>Location:</strong> ${listing.city}${
            listing.province ? `, ${listing.province}` : ""
          }</p>

          <p>
            <a href="https://northstock.ca/listings/${listing.listingId}">
              View Listing
            </a>
          </p>

          <p>NorthStock</p>
        `,
      });

      sent++;
    }

    return Response.json({
      data: {
        sent,
        matchedSearches: matches.length,
      },
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        data: null,
        error,
      },
      {
        status: 500,
      }
    );
  }
}