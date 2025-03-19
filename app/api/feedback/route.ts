import { NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error("Missing SENDGRID_API_KEY environment variable");
}
sendgrid.setApiKey(apiKey || "");

const sendEmail = async (type: string, message: string) => {
  const toEmail = process.env.MY_EMAIL;
  const fromEmail = process.env.SENDER_EMAIL;

  if (!toEmail || !fromEmail) {
    console.error("Missing email configuration", { toEmail, fromEmail });
    throw new Error("Email configuration incomplete");
  }

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject: `New Feedback: ${type}`,
    text: message,
  };

  try {
    await sendgrid.send(msg);
    console.log("Email sent successfully");
  } catch (error: unknown) {
    const sendGridError = error as { response?: { body?: unknown } };
    console.error("SendGrid error:", sendGridError.response?.body || error);
    throw error;
  }
};

export async function POST(req: Request) {
  console.log("Feedback API called");

  try {
    // Log request content type
    console.log("Request headers:", Object.fromEntries(req.headers));

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", body);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { type, message } = body;

    // Validate required fields
    if (!type || !message) {
      console.error("Missing required fields", { type, message });
      return NextResponse.json(
        { error: "Missing required fields: type and message are required" },
        { status: 400 }
      );
    }

    // Send email
    await sendEmail(type, message);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const apiError = error as { message?: string; code?: string };
    console.error("Feedback API error:", error);

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to send feedback",
        details: apiError.message || "Unknown error",
        code: apiError.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
