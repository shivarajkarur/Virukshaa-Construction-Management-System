import { NextResponse } from 'next/server';

export async function GET() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    // For security, let's not expose the full URI.
    // We'll just confirm it exists and show a snippet.
    const isUriPresent = !!mongoUri;
    const uriSnippet = mongoUri.substring(0, 20) + '...'; // Show a small part
    return NextResponse.json({
      message: 'MONGODB_URI is loaded.',
      isPresent: isUriPresent,
      snippet: uriSnippet,
    });
  } else {
    return NextResponse.json(
      { 
        message: 'Error: MONGODB_URI is NOT found in the environment variables.',
        isPresent: false,
      },
      { status: 500 }
    );
  }
}
