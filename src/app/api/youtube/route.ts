import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    // Fetch the raw HTML from YouTube search
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Regex to find the first video ID in the initial data payload
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    
    if (match && match[1]) {
      return NextResponse.json({ videoId: match[1] });
    }
    
    return NextResponse.json({ error: 'No video found for query' }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
