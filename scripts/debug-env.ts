import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment Variables:');
console.log('---------------------');
console.log(`CLOUDFLARE_R2_ACCESS_KEY_ID: ${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length} characters`);
console.log(`CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length} characters`);
console.log('CLOUDFLARE_R2_ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT);
console.log('CLOUDFLARE_R2_BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
console.log('CLOUDFLARE_R2_PUBLIC_URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL);

// Check Next.js environment variables
console.log('\nNext.js Runtime Environment:');
console.log('--------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_* variables:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
