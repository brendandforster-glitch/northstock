import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      sellerEmail,
      buyerEmail,
      buyerName,
      buyerPhone,
      buyerMessage,
      listingTitle,
      listingId,
    } = body;

    if (!sellerEmail) {
      return Response.json(
        { data: null, error: "Seller email is missing." },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: "NorthStock <info@northstock.ca>",
      to: [sellerEmail],
      cc: ["info@northstock.ca"],
      replyTo: buyerEmail,
      subject: `New Quote Request: ${listingTitle || "NorthStock Listing"}`,
      html: `
        <h2>New Quote Request</h2>

        <p>You received a new quote request on NorthStock.</p>

        <p><strong>Listing:</strong> ${listingTitle || "Unknown listing"}</p>

        <p><strong>Buyer Name:</strong> ${buyerName || "Not provided"}</p>
        <p><strong>Buyer Email:</strong> ${buyerEmail || "Not provided"}</p>
        <p><strong>Buyer Phone:</strong> ${buyerPhone || "Not provided"}</p>

        <p><strong>Message:</strong></p>
        <p>${buyerMessage ? buyerMessage.replace(/\n/g, "<br />") : "No message provided."}</p>

        <p>
          <a href="https://northstock.ca/listings/${listingId || ""}">
            View Listing
          </a>
        </p>

        <p>
          <a href="https://northstock.ca/seller/leads">
            View Quote Requests
          </a>
        </p>

        <p>NorthStock</p>
      `,
    });

    return Response.json({
      data,
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