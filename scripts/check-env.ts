import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Check R2 environment variables
const r2Vars = {
  'CLOUDFLARE_R2_ACCESS_KEY_ID': {
    value: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    length: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length,
    valid: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length === 32
  },
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY': {
    value: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '***' + process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY.slice(-4) : undefined,
    length: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length,
    valid: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length === 64
  },
  'CLOUDFLARE_R2_ENDPOINT': process.env.CLOUDFLARE_R2_ENDPOINT,
  'CLOUDFLARE_R2_BUCKET_NAME': process.env.CLOUDFLARE_R2_BUCKET_NAME,
  'CLOUDFLARE_R2_PUBLIC_URL': process.env.CLOUDFLARE_R2_PUBLIC_URL
};

console.log('Current R2 Environment Variables:');
console.table(r2Vars);

// Check for missing variables
const missingVars = Object.entries(r2Vars)
  .filter(([_, value]) => value === undefined || value === '')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Check for invalid access key length
if (!r2Vars.CLOUDFLARE_R2_ACCESS_KEY_ID.valid) {
  console.error('\n❌ Invalid CLOUDFLARE_R2_ACCESS_KEY_ID:');
  console.error(`  - Current length: ${r2Vars.CLOUDFLARE_R2_ACCESS_KEY_ID.length} characters`);
  console.error('  - Expected length: 32 characters');
  console.error('\nPlease update your CLOUDFLARE_R2_ACCESS_KEY_ID in the .env file.');
  process.exit(1);
}

// Check for invalid secret key length
if (!r2Vars.CLOUDFLARE_R2_SECRET_ACCESS_KEY.valid) {
  console.error('\n❌ Invalid CLOUDFLARE_R2_SECRET_ACCESS_KEY:');
  console.error(`  - Current length: ${r2Vars.CLOUDFLARE_R2_SECRET_ACCESS_KEY.length} characters`);
  console.error('  - Expected length: 64 characters');
  console.error('\nPlease update your CLOUDFLARE_R2_SECRET_ACCESS_KEY in the .env file.');
  process.exit(1);
}

console.log('\n✅ All R2 environment variables are properly configured!');
