import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: "NorthStock <onboarding@resend.dev>",
      to: ["brendandforster@gmail.com"],
      subject: "NorthStock Test Email",
      html: `
        <h1>NorthStock Email Test</h1>
        <p>If you received this email, Resend is connected successfully.</p>
      `,
    });

    return Response.json({ data, error: null });
  } catch (error) {
    return Response.json({ data: null, error }, { status: 500 });
  }
}