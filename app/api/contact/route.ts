import { NextResponse } from "next/server";
import { Resend } from "resend";
import { allowRequest, cleanText, clientIp, escapeHtml, isEmail } from "@/lib/server/security";

export async function POST(req: Request) {
  try {
    if (!allowRequest(`contact:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254).toLowerCase();
    const message = cleanText(body.message, 3000);
    const website = cleanText(body.website, 200);

    if (website) return NextResponse.json({ success: true });

    if (!name || !isEmail(email) || message.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid name, email, and message." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) throw new Error("Email service is not configured.");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "NorthStock <info@northstock.ca>",
      to: "info@northstock.ca",
      replyTo: email,
      subject: "New NorthStock contact message",
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "The message could not be sent. Please email info@northstock.ca." },
      { status: 500 }
    );
  }
}
