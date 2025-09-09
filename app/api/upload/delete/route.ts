import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json()

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400 }
      )
    }

    // Extract the key from the public URL
    const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL
    if (!publicUrlBase) {
      throw new Error('R2 public URL not configured')
    }

    const key = fileUrl.replace(`${publicUrlBase}/`, '')

    // Delete from R2
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      })
    )

    return NextResponse.json({
      message: 'File deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Delete error:', error)
    
    let errorMessage = 'Failed to delete file'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.name === 'NoSuchKey') {
        errorMessage = 'File not found'
        statusCode = 404
      } else if (error.name === 'AccessDenied') {
        errorMessage = 'Access denied to Cloudflare R2 bucket'
        statusCode = 403
      } else {
        errorMessage = `Delete failed: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}