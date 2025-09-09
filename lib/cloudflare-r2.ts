import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3ServiceException } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate required environment variables
const requiredEnvVars = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL'
];

// Check if all required environment variables are set
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('❌ Missing required Cloudflare R2 environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
}

// Log environment variables for debugging
console.log('R2 Configuration:');
console.log('- Endpoint:', process.env.CLOUDFLARE_R2_ENDPOINT);
console.log('- Bucket Name:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
console.log('- Public URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL);
console.log('- Access Key Length:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim().length);
console.log('- Secret Key Length:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim().length);

// Safely read and trim environment variables to avoid hidden whitespace issues
const TRIMMED_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
const TRIMMED_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const TRIMMED_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

// Optional: warn early if lengths look incorrect
if (TRIMMED_ACCESS_KEY_ID && TRIMMED_ACCESS_KEY_ID.length !== 32) {
  console.warn(`⚠️ CLOUDFLARE_R2_ACCESS_KEY_ID length is ${TRIMMED_ACCESS_KEY_ID.length}, expected 32`);
}
if (TRIMMED_SECRET_ACCESS_KEY && TRIMMED_SECRET_ACCESS_KEY.length !== 64) {
  console.warn(`⚠️ CLOUDFLARE_R2_SECRET_ACCESS_KEY length is ${TRIMMED_SECRET_ACCESS_KEY.length}, expected 64`);
}

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: TRIMMED_ENDPOINT,
  credentials: {
    accessKeyId: TRIMMED_ACCESS_KEY_ID!,
    secretAccessKey: TRIMMED_SECRET_ACCESS_KEY!,
  },
  // Add retry configuration
  maxAttempts: 3,
  // Add request timeout
  requestHandler: {
    requestTimeout: 10000, // 10 seconds
  },
  // Force path style URLs
  forcePathStyle: true,
})

export interface UploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    if (!BUCKET_NAME || !PUBLIC_URL) {
      throw new Error('Cloudflare R2 configuration is incomplete. Check your environment variables.');
    }

    console.log(`Starting upload to R2: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const key = `${folder}/${fileName}`;

    console.log(`Generated file key: ${key}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('File converted to buffer, size:', buffer.length, 'bytes');

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log('Sending upload request to R2...');
    const startTime = Date.now();
    
    try {
      const response = await r2Client.send(command);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Upload completed in ${duration}ms. ETag: ${response.ETag}`);
      
      // Return public URL
      const fileUrl = `${PUBLIC_URL}/${key}`;
      console.log(`File URL: ${fileUrl}`);

      return {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };
    } catch (s3Error) {
      const error = s3Error as S3ServiceException;
      console.error('❌ R2 Upload Error:', {
        name: error.name,
        message: error.message,
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        cfId: (error.$metadata as any)?.cfId,
        extendedRequestId: error.$metadata?.extendedRequestId,
        stack: error.stack
      });
      
      throw new Error(`Failed to upload file to Cloudflare R2: ${error.message}`, { cause: error });
    }
  } catch (error) {
    console.error('Error in uploadToR2:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to Cloudflare R2: ${error.message}`, { cause: error });
    }
    
    throw new Error('An unknown error occurred while uploading to Cloudflare R2');
  }
}

/**
 * Upload buffer to Cloudflare R2
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const finalFileName = `${timestamp}_${sanitizedName}`
    const key = `${folder}/${finalFileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    })

    await r2Client.send(command)

    const fileUrl = `${PUBLIC_URL}/${key}`

    return {
      fileUrl,
      fileName,
      fileSize: buffer.length,
      fileType: contentType,
    }
  } catch (error) {
    console.error('Error uploading buffer to R2:', error)
    throw new Error('Failed to upload buffer to Cloudflare R2')
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const key = fileUrl.replace(`${PUBLIC_URL}/`, '')

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Error deleting from R2:', error)
    throw new Error('Failed to delete file from Cloudflare R2')
  }
}

/**
 * Generate a presigned URL for secure file access
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(r2Client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate presigned URL')
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, maxSizeMB: number = 10): void {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported`)
  }

  const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
  }
}

export default r2Client
