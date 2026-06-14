import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: "NorthStock <noreply@northstock.ca>",
      to: ["info@northstock.ca"],
      replyTo: email,
      subject: `New NorthStock Contact Form Submission`,
      html: `
        <h2>New Contact Form Submission</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Message:</strong></p>

        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}