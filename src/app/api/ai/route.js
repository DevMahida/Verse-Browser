import { NextResponse } from 'next/server';

const API_URL = "https://versr-ai-browser-verse.hf.space";

export async function POST(req) {
  try {
    const { endpoint, payload } = await req.json();
    
    if (!endpoint || !payload) {
      return NextResponse.json({ error: "Missing endpoint or payload" }, { status: 400 });
    }

    const finalPayload = {
      ...payload,
      api_key: payload.api_key || process.env.OPENROUTER_API_KEY
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });

    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: "Non-JSON response", text };
    }
    
    if (!response.ok) {
      const errorMsg = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : `Server error: ${response.status}`;
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
