import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const accountId = import.meta.env.R2_ACCOUNT_ID;
const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY;
const bucket = import.meta.env.R2_BUCKET;
const endpoint = import.meta.env.R2_ENDPOINT ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const publicBaseUrl = import.meta.env.R2_PUBLIC_BASE_URL ?? endpoint;
const prefix = import.meta.env.R2_MEDIA_PREFIX ?? 'uploads';

let client: S3Client | undefined;

function ensureClient() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error('Cloudflare R2 environment variables are not fully configured.');
  }

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return client;
}

export type UploadMediaInput = {
  contents: ArrayBuffer | Uint8Array;
  contentType: string;
  key?: string;
  cacheControl?: string;
};

export async function uploadMediaToR2({ contents, contentType, key, cacheControl }: UploadMediaInput) {
  const s3 = ensureClient();

  const buffer = contents instanceof ArrayBuffer ? new Uint8Array(contents) : contents;
  const objectKey = key ?? `${prefix}/${randomUUID()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl ?? 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key: objectKey,
    url: getMediaPublicUrl(objectKey),
  };
}

export async function deleteMediaFromR2(key: string) {
  const s3 = ensureClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export function getMediaPublicUrl(key: string): string {
  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL is not set.');
  }

  const base = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${base}/${key}`;
}

export function getMediaBucket() {
  if (!bucket) {
    throw new Error('R2_BUCKET is not defined');
  }
  return bucket;
}


