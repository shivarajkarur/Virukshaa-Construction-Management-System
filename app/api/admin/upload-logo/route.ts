import { NextRequest, NextResponse } from 'next/server'
import r2Client, { uploadToR2, validateFile, deleteFromR2 } from '@/lib/cloudflare-r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'profile'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type and size (5MB limit for images)
    try {
      validateFile(file, 5) // 5MB limit for admin images
    } catch (validationError) {
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'File validation failed' 
      }, { status: 400 })
    }

    // Only allow image files for admin uploads
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!imageTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Determine folder based on type
    let folder = 'admin/profiles'
    if (type === 'logo') folder = 'admin/logos'
    else if (type === 'background') folder = 'admin/backgrounds'

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2(file, folder)

    return NextResponse.json(uploadResult)

  } catch (error) {
    console.error('Admin upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { fileUrl?: string }
    const fileUrl = body?.fileUrl

    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 })
    }

    const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || ''
    if (!publicBase || !bucket) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    // Only allow deletion in admin/backgrounds for safety
    const allowedPrefix = `${publicBase}/admin/backgrounds/`
    if (!fileUrl.startsWith(allowedPrefix)) {
      return NextResponse.json({ error: 'Invalid background file URL' }, { status: 400 })
    }

    // Perform deletion
    await deleteFromR2(fileUrl)

    // Verify deletion by attempting to read object
    const key = fileUrl.replace(`${publicBase}/`, '')
    let verified = false
    try {
      await r2Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      // If we reach here, object still exists
      verified = false
    } catch (err: any) {
      // Expect NoSuchKey or 404 after deletion
      const code = err?.$metadata?.httpStatusCode
      const name = err?.name
      if (code === 404 || name === 'NoSuchKey' || /NoSuchKey/i.test(String(err?.message))) {
        verified = true
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Deletion verification failed', verified: false }, { status: 500 })
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error('Admin background delete error:', error)
    return NextResponse.json({ error: 'Failed to delete background image' }, { status: 500 })
  }
}
