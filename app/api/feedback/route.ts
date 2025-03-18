import { NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

const sendEmail = async (type: string, message: string) => {
  const msg = {
    to: process.env.MY_EMAIL!, // Your Gmail address
    from: process.env.SENDER_EMAIL!, // Must match the verified sender
    subject: `New Feedback: ${type}`,
    text: message,
  };

  await sendgrid.send(msg);
};

export async function POST(req: Request) {
  try {
    const { type, message } = await req.json();

    console.log(type, message);

    await sendEmail(type, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 }
    );
  }
}
