import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Check if all required environment variables are set
const requiredEnvVars = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`  - ${varName}`))
  process.exit(1)
}

console.log('✅ All required environment variables are present')

// Initialize the S3 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

async function testR2Connection() {
  try {
    console.log('\n🔍 Testing R2 connection...')
    
    // List objects in the bucket to test the connection
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      MaxKeys: 1, // Just fetch 1 object to test the connection
    })

    const response = await r2Client.send(command)
    console.log('✅ Successfully connected to R2 bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME)
    console.log('\n📋 Bucket contents (first item):', 
      response.Contents?.[0]?.Key || 'No objects found in bucket')
    
  } catch (error) {
    console.error('\n❌ Failed to connect to R2:')
    console.error(error)
    
    if (error.name === 'InvalidAccessKeyId') {
      console.error('\n🔑 Error: The provided R2 Access Key ID is invalid')
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n🔑 Error: The provided R2 Secret Access Key is invalid')
    } else if (error.name === 'NoSuchBucket') {
      console.error(`\n📦 Error: The bucket "${process.env.CLOUDFLARE_R2_BUCKET_NAME}" does not exist`)
    } else if (error.code === 'CredentialsProviderError') {
      console.error('\n🔑 Error: Failed to load credentials. Please check your .env file')
    }
    
    process.exit(1)
  }
}

testR2Connection()
