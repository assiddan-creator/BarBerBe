import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: {
    hairstyleName?: string;
    beardName?: string;
    mode?: string;
    analysisText?: string;
    isBarberMode?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    hairstyleName = "",
    beardName = "",
    mode = "",
    analysisText = "",
    isBarberMode = false,
  } = body;

  const systemPrompt = isBarberMode
    ? "אתה מומחה תספורות מקצועי בישראל. אתה מדבר לספר בשפה מקצועית וטכנית. תמיד בעברית. תמיד קצר — 4 נקודות בלבד בפורמט: • טכניקה • אורכים • כלים • טיפ מקצועי."
    : "אתה יועץ סגנון אישי ברמה הגבוהה ביותר בישראל. אתה מדבר ישירות ללקוח בשפה חמה, אישית ומעודדת. תמיד בעברית. תמיד קצר — 3 משפטים בלבד.";

  const userPrompt = isBarberMode
    ? `הלקוח בחר: ${hairstyleName}${beardName ? " עם זקן " + beardName : ""}. ניתוח AI: ${analysisText}. כתוב הוראות מקצועיות קצרות לספר.`
    : `הלקוח בחר: ${hairstyleName}${beardName ? " עם זקן " + beardName : ""}. ניתוח AI: ${analysisText}. כתוב 3 משפטים אישיים שמסבירים למה הלוק הזה מתאים לו, מה הוא יקרין, ואיך ירגיש עם הלוק הזה.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { content?: { type: string; text?: string }[]; error?: { message?: string } }
      | null;

    if (!response.ok) {
      const message =
        data?.error?.message ?? `Anthropic API error: ${response.status}`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const text =
      data?.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "No text in Anthropic response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ advice: text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get advice";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
