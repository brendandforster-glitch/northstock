import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type BuyerResponseRow = {
  id: string;
  request_id: string;
  company_name: string | null;
  message: string;
  price_quote: string | null;
  availability: string | null;
  created_at: string;
};

type BuyerRequestRow = {
  id: string;
  company_name: string | null;
  title: string;
  category: string;
  status: string;
  fulfilled: boolean;
  expires_at: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Required server configuration is missing.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to view your responses.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(
      "Bearer ".length
    );

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
        {
          error:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const {
      data: responseRows,
      error: responsesError,
    } = await supabaseAdmin
      .from("buyer_request_responses")
      .select(
        "id, request_id, company_name, message, price_quote, availability, created_at"
      )
      .eq("seller_user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (responsesError) {
      console.error(
        "Seller buyer responses lookup error:",
        responsesError
      );

      return NextResponse.json(
        {
          error:
            "Your buyer request responses could not be loaded.",
        },
        { status: 500 }
      );
    }

    const responses =
      (responseRows || []) as BuyerResponseRow[];

    const requestIds = [
      ...new Set(
        responses.map((item) => item.request_id)
      ),
    ];

    let buyerRequests: BuyerRequestRow[] = [];

    if (requestIds.length > 0) {
      const {
        data: requestRows,
        error: requestsError,
      } = await supabaseAdmin
        .from("buyer_requests")
        .select(
          "id, company_name, title, category, status, fulfilled, expires_at, created_at"
        )
        .in("id", requestIds);

      if (requestsError) {
        console.error(
          "Buyer requests lookup error:",
          requestsError
        );

        return NextResponse.json(
          {
            error:
              "The related buyer requests could not be loaded.",
          },
          { status: 500 }
        );
      }

      buyerRequests =
        (requestRows || []) as BuyerRequestRow[];
    }

    const requestById = new Map(
      buyerRequests.map((buyerRequest) => [
        buyerRequest.id,
        buyerRequest,
      ])
    );

    return NextResponse.json(
      {
        responses: responses.map((response) => ({
          ...response,
          request:
            requestById.get(response.request_id) ||
            null,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Seller buyer responses route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}