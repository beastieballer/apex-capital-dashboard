import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const { imageBase64, mimeType = "image/jpeg" } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const prompt = `You are a window measurement expert analyzing a photo of a window.

Examine this window photo carefully and estimate:
1. The window width in inches
2. The window height in inches
3. The window type (single pane, double pane, sliding, casement, bay, etc.)
4. Any special notes (arched top, divided lights, tinted, etc.)

Look for reference objects to gauge scale: door frames (~80" tall, 36" wide), standard outlets (~4" wide), furniture, people, etc.

Return ONLY valid JSON with these exact fields:
{
  "width": <number in inches>,
  "height": <number in inches>,
  "windowType": "<string>",
  "notes": "<string with observations>",
  "confidence": "<low|medium|high>",
  "referenceObject": "<what you used for scale, or none>"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json({ error: "Analysis failed", detail: String(err) }, { status: 500 });
  }
}
