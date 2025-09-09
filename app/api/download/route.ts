import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    const name = searchParams.get('name') || 'attachment'

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    // Fetch the file from the remote URL. This avoids client-side CORS issues.
    const fileRes = await fetch(url, { cache: 'no-store' })
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch file from source' }, { status: 502 })
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await fileRes.arrayBuffer()

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Force download in the browser
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
