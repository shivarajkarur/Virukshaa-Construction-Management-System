import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, validateFile } from '@/lib/cloudflare-r2'

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
