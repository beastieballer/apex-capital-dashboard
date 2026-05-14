import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getJob } from "@/lib/db";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { jobId, amount, description } = await req.json();

  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: job.customer.email || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `Window Film Installation — ${job.jobNumber}`,
            description: description ?? job.description,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { jobId },
    success_url: `${appUrl}/jobs/${jobId}/payment?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/jobs/${jobId}/payment?cancelled=1`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
