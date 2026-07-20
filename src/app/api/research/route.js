import { NextResponse } from 'next/server';

const TAVILY_API_URL = 'https://api.tavily.com';

/**
 * POST /api/research — Start a deep research task via Tavily
 * Supports SSE streaming (stream: true) and polling (stream: false)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { query, model = 'mini', outputLength = 'standard', pageContext, includeDomains, excludeDomains } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Missing research query' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-tavily-key');
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'Tavily API key not configured. Please connect your API key in the Deep Search settings.' },
        { status: 401 }
      );
    }

    // Build the research input — optionally include page context
    let researchInput = query;
    if (pageContext && pageContext.trim()) {
      researchInput = `${query}\n\nContext from current webpage:\n${pageContext.substring(0, 4000)}`;
    }

    const tavilyPayload = {
      input: researchInput,
      model: model,
      stream: true,
      output_length: outputLength,
      citation_format: 'numbered',
    };

    if (includeDomains && includeDomains.length > 0) {
      tavilyPayload.include_domains = includeDomains;
    }
    if (excludeDomains && excludeDomains.length > 0) {
      tavilyPayload.exclude_domains = excludeDomains;
    }

    // Call Tavily Research API with streaming
    const tavilyResponse = await fetch(`${TAVILY_API_URL}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(tavilyPayload),
    });

    if (!tavilyResponse.ok) {
      const errText = await tavilyResponse.text();
      let errMsg;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.detail || errJson?.error?.message || errJson?.message || errText;
      } catch {
        errMsg = errText;
      }
      return NextResponse.json(
        { error: `Tavily API error (${tavilyResponse.status}): ${errMsg}` },
        { status: tavilyResponse.status }
      );
    }

    // If streaming response, forward the SSE stream to the client
    if (tavilyResponse.headers.get('content-type')?.includes('text/event-stream')) {
      const transformStream = new TransformStream();
      const writer = transformStream.writable.getWriter();
      const encoder = new TextEncoder();

      // Process the Tavily SSE stream in the background
      (async () => {
        const reader = tavilyResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  await writer.write(encoder.encode(`data: [DONE]\n\n`));
                  continue;
                }
                // Forward the event data to client
                await writer.write(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }
        } catch (e) {
          console.error('Tavily stream error:', e);
          const errorEvent = JSON.stringify({ error: e.message });
          await writer.write(encoder.encode(`data: ${errorEvent}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(transformStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback: Tavily returned a JSON response (polling mode)
    const data = await tavilyResponse.json();

    // If we get a request_id, we need to poll for completion
    if (data.request_id && data.status !== 'completed') {
      return NextResponse.json({
        requestId: data.request_id,
        status: data.status || 'pending',
      });
    }

    // Completed directly
    return NextResponse.json({
      content: data.content || data.output || '',
      sources: data.sources || [],
      status: 'completed',
    });

  } catch (error) {
    console.error('Research Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during research.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/research?requestId=xxx — Poll for research completion (fallback)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-tavily-key');
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'Tavily API key not configured. Please connect your API key in the Deep Search settings.' },
        { status: 401 }
      );
    }

    const pollResponse = await fetch(`${TAVILY_API_URL}/get_research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({ request_id: requestId }),
    });

    if (!pollResponse.ok) {
      const errText = await pollResponse.text();
      return NextResponse.json(
        { error: `Tavily poll error (${pollResponse.status}): ${errText}` },
        { status: pollResponse.status }
      );
    }

    const data = await pollResponse.json();
    return NextResponse.json({
      content: data.content || data.output || '',
      sources: data.sources || [],
      status: data.status || 'pending',
      requestId,
    });

  } catch (error) {
    console.error('Research Poll Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
