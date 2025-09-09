import { S3Client } from "@aws-sdk/client-s3";

const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();

export const r2 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID!,
    secretAccessKey: SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
});
