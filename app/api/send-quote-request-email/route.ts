import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const data = await resend.emails.send({
    from: "NorthStock <onboarding@resend.dev>",
    to: ["brendandforster@gmail.com"],
    subject: "NorthStock Quote Route Test",
    html: "<p>The quote email route is working.</p>",
  });

  return Response.json({ data, error: null });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sellerEmail, buyerEmail, listingTitle, listingId } = body;

    const recipients = [
  sellerEmail,
  "info@northstock.ca",
  "brendandforster@gmail.com",
].filter(Boolean);

    const data = await resend.emails.send({
      from: "NorthStock <onboarding@resend.dev>",
      to: recipients,
      subject: `New Quote Request: ${listingTitle || "NorthStock Listing"}`,
      html: `
        <h2>New Quote Request</h2>

        <p>You received a new quote request on NorthStock.</p>

        <p><strong>Listing:</strong> ${listingTitle || "Unknown listing"}</p>
        <p><strong>Buyer Email:</strong> ${buyerEmail || "Unknown buyer"}</p>

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

    return Response.json({ data, error: null });
  } catch (error) {
    return Response.json({ data: null, error }, { status: 500 });
  }
}