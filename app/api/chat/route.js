export async function POST(req) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "CLAUDE_API_KEY არ არის დაყენებული Vercel-ის environment variables-ში." },
        { status: 500 }
      );
    }

    const messages = [
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system:
          "შენ ხარ JARVIS — ქართულენოვანი AI ასისტენტი. პასუხები გასცე ქართულად, გარდა იმ შემთხვევისა, თუ მომხმარებელი სხვა ენაზე მიგვმართავს.",
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    const textBlock = data.content?.find((c) => c.type === "text");

    return Response.json({
      reply: textBlock?.text || "",
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
