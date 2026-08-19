import { Resend } from "resend";
import { bearerToken, getUserFromToken, isAdminUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const { admin, user } = await getUserFromToken(bearerToken(request));
    if (!user?.email || !(await isAdminUser(admin, user))) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) throw new Error("Email service is not configured.");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "NorthStock <info@northstock.ca>",
      to: user.email,
      subject: "NorthStock Test Email",
      text: "NorthStock email delivery is configured correctly.",
      html: `
        <h1>NorthStock Email Test</h1>
        <p>If you received this email, Resend is connected successfully.</p>
      `,
    });

    if (error) throw error;
    return Response.json({ data, error: null });
  } catch (error) {
    return Response.json({ data: null, error }, { status: 500 });
  }
}
