import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ALLOWED_STATUSES = [
  "pending",
  "shortlisted",
  "accepted",
  "declined",
] as const;

type ResponseStatus = (typeof ALLOWED_STATUSES)[number];

type BuyerRequestRow = {
  id: string;
  user_id: string;
  company_name: string | null;
  title: string;
  fulfilled: boolean;
  status: string;
};

type SellerResponseRow = {
  id: string;
  request_id: string;
  seller_user_id: string;
  company_name: string | null;
  message: string;
  price_quote: string | null;
  availability: string | null;
  status: ResponseStatus;
  status_updated_at: string | null;
  created_at: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isResponseStatus(value: unknown): value is ResponseStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as ResponseStatus)
  );
}

function getServerConfiguration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    serviceRoleKey,
  };
}

function getAccessToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

export async function GET(request: NextRequest) {
  try {
    const configuration = getServerConfiguration();

    if (!configuration) {
      return NextResponse.json(
        {
          error: "Required server configuration is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "You must be logged in to view seller responses.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin = createClient(
      configuration.supabaseUrl,
      configuration.serviceRoleKey,
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
          error: "Your session is invalid or has expired.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: buyerRequests,
      error: requestError,
    } = await supabaseAdmin
      .from("buyer_requests")
      .select("id")
      .eq("user_id", user.id);

    if (requestError) {
      console.error(
        "Buyer request ownership lookup error:",
        requestError
      );

      return NextResponse.json(
        {
          error: "Your buyer requests could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    const requestIds = (buyerRequests || []).map(
      (item) => item.id as string
    );

    if (requestIds.length === 0) {
      return NextResponse.json(
        {
          responses: [],
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const {
      data: responses,
      error: responsesError,
    } = await supabaseAdmin
      .from("buyer_request_responses")
      .select(
        "id, request_id, company_name, message, price_quote, availability, status, status_updated_at, created_at"
      )
      .in("request_id", requestIds)
      .order("created_at", {
        ascending: false,
      });

    if (responsesError) {
      console.error(
        "Buyer response lookup error:",
        responsesError
      );

      return NextResponse.json(
        {
          error: "Seller responses could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        responses: responses || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Buyer response GET route error:",
      error
    );

    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const configuration = getServerConfiguration();

    if (!configuration) {
      return NextResponse.json(
        {
          error: "Required server configuration is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "You must be logged in to manage seller responses.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const responseId =
      typeof body.responseId === "string"
        ? body.responseId.trim()
        : "";

    const nextStatus = body.status;

    if (!responseId || !isResponseStatus(nextStatus)) {
      return NextResponse.json(
        {
          error: "A valid response and status are required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseAdmin = createClient(
      configuration.supabaseUrl,
      configuration.serviceRoleKey,
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
          error: "Your session is invalid or has expired.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: sellerResponse,
      error: responseError,
    } = await supabaseAdmin
      .from("buyer_request_responses")
      .select(
        "id, request_id, seller_user_id, company_name, message, price_quote, availability, status, status_updated_at, created_at"
      )
      .eq("id", responseId)
      .single();

    if (responseError || !sellerResponse) {
      return NextResponse.json(
        {
          error: "Seller response not found.",
        },
        {
          status: 404,
        }
      );
    }

    const responseRow =
      sellerResponse as SellerResponseRow;

    const {
      data: buyerRequest,
      error: buyerRequestError,
    } = await supabaseAdmin
      .from("buyer_requests")
      .select(
        "id, user_id, company_name, title, fulfilled, status"
      )
      .eq("id", responseRow.request_id)
      .single();

    if (buyerRequestError || !buyerRequest) {
      return NextResponse.json(
        {
          error: "The related buyer request was not found.",
        },
        {
          status: 404,
        }
      );
    }

    const ownedRequest =
      buyerRequest as BuyerRequestRow;

    if (ownedRequest.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to manage this response.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      ownedRequest.fulfilled ||
      ownedRequest.status === "fulfilled"
    ) {
      return NextResponse.json(
        {
          error:
            "This request has already been marked fulfilled.",
        },
        {
          status: 400,
        }
      );
    }

    const previousStatus =
      responseRow.status || "pending";

    const statusUpdatedAt =
      new Date().toISOString();

    /*
     * Only one response can be accepted at a time.
     * If another response was previously accepted,
     * move it back to Shortlisted.
     */
    if (nextStatus === "accepted") {
      const {
        error: resetError,
      } = await supabaseAdmin
        .from("buyer_request_responses")
        .update({
          status: "shortlisted",
          status_updated_at: statusUpdatedAt,
        })
        .eq("request_id", responseRow.request_id)
        .eq("status", "accepted")
        .neq("id", responseId);

      if (resetError) {
        console.error(
          "Previous accepted response reset error:",
          resetError
        );

        return NextResponse.json(
          {
            error:
              "The response status could not be updated.",
          },
          {
            status: 500,
          }
        );
      }
    }

    const {
      data: updatedResponse,
      error: updateError,
    } = await supabaseAdmin
      .from("buyer_request_responses")
      .update({
        status: nextStatus,
        status_updated_at: statusUpdatedAt,
      })
      .eq("id", responseId)
      .select(
        "id, request_id, company_name, message, price_quote, availability, status, status_updated_at, created_at"
      )
      .single();

    if (updateError || !updatedResponse) {
      console.error(
        "Buyer response status update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "The response status could not be updated.",
        },
        {
          status: 500,
        }
      );
    }

    let notificationSent = false;

    /*
     * Email the seller when the buyer accepts them.
     * Do not send another email if it was already accepted.
     */
    if (
      nextStatus === "accepted" &&
      previousStatus !== "accepted"
    ) {
      const resendApiKey =
        process.env.RESEND_API_KEY;

      const {
        data: sellerUser,
        error: sellerUserError,
      } =
        await supabaseAdmin.auth.admin.getUserById(
          responseRow.seller_user_id
        );

      if (sellerUserError) {
        console.error(
          "Accepted seller email lookup error:",
          sellerUserError
        );
      }

      if (
        resendApiKey &&
        sellerUser.user?.email
      ) {
        const siteUrl = (
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://northstock.ca"
        ).replace(/\/$/, "");

        const sellerCompany =
          responseRow.company_name ||
          "NorthStock Seller";

        const buyerCompany =
          ownedRequest.company_name ||
          "NorthStock Buyer";

        const resend = new Resend(resendApiKey);

        const {
          error: emailError,
        } = await resend.emails.send({
          from:
            "NorthStock <info@northstock.ca>",

          to: sellerUser.user.email,

          subject:
            `Your response was accepted: ${ownedRequest.title}`,

          ...(user.email
            ? {
                replyTo: user.email,
              }
            : {}),

          html: `
            <div style="background:#f1f5f9;padding:32px;font-family:Arial,sans-serif;color:#0f172a;">
              <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #cbd5e1;border-radius:18px;background:#ffffff;">
                <div style="background:#020617;padding:28px;color:#ffffff;">
                  <p style="margin:0 0 8px;color:#86efac;font-size:13px;font-weight:bold;text-transform:uppercase;">
                    Response Accepted
                  </p>

                  <h1 style="margin:0;font-size:26px;line-height:1.3;">
                    ${escapeHtml(ownedRequest.title)}
                  </h1>
                </div>

                <div style="padding:28px;">
                  <p style="margin:0 0 18px;font-size:17px;line-height:1.6;">
                    Good news,
                    <strong>${escapeHtml(sellerCompany)}</strong>.
                    ${escapeHtml(buyerCompany)}
                    accepted your response to this buyer request.
                  </p>

                  <div style="border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;padding:18px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#64748b;">
                      Next Step
                    </p>

                    <p style="margin:0;line-height:1.7;">
                      Reply directly to this email to continue the
                      conversation with the buyer and confirm the details.
                    </p>
                  </div>

                  <a
                    href="${siteUrl}/seller/buyer-responses"
                    style="display:inline-block;margin-top:22px;border-radius:10px;background:#2563eb;padding:14px 20px;color:#ffffff;text-decoration:none;font-weight:bold;"
                  >
                    View My Responses
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
          console.error(
            "Accepted response notification error:",
            emailError
          );
        } else {
          notificationSent = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      response: updatedResponse,
      notificationSent,
    });
  } catch (error) {
    console.error(
      "Buyer response PATCH route error:",
      error
    );

    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}