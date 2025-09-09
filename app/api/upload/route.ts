import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

// Allowed MIME types
const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
]

const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type based on upload type
    if (formData.get('type') === 'avatar') {
      if (!IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Only image files are allowed for avatars' },
          { status: 400 }
        )
      }
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    // Determine folder based on upload type
    let folder = 'reports' // default folder
    const uploadType = formData.get('type') as string
    if (uploadType === 'avatar') {
      folder = 'avatars'
    } else if (uploadType === 'report') {
      folder = 'reports'
    } else if (conversationId) {
      folder = `messages/${conversationId}`
    }
    const key = `${folder}/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    // Generate public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`

    return NextResponse.json({
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

  } catch (error: unknown) {
    console.error('Upload error:', error)
    
    let errorMessage = 'Failed to upload file'
    let statusCode = 500
    
    if (error instanceof Error) {
      // Handle specific S3/R2 error cases
      if (error.name === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid Cloudflare R2 Access Key ID';
        statusCode = 403;
      } else if (error.name === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid Cloudflare R2 Secret Access Key';
        statusCode = 403;
      } else if (error.name === 'NoSuchBucket') {
        errorMessage = `Bucket "${process.env.CLOUDFLARE_R2_BUCKET_NAME}" not found`;
        statusCode = 404;
      } else if (error.name === 'AccessDenied') {
        errorMessage = 'Access denied to Cloudflare R2 bucket. Check your permissions.';
        statusCode = 403;
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
