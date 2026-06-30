import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from 'npm:@aws-sdk/client-s3@3.758.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.758.0';

import {
  FILM_SIGNED_URL_TTL_SECONDS,
  FILM_UPLOAD_URL_TTL_SECONDS,
} from './filmStorage.ts';

let cachedClient: S3Client | null = null;

function getR2Config() {
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const endpoint = Deno.env.get('R2_ENDPOINT');
  const bucketName = Deno.env.get('R2_BUCKET_NAME');

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error('Missing Cloudflare R2 configuration.');
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName,
  };
}

export function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const { accessKeyId, secretAccessKey, endpoint } = getR2Config();

  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return getR2Config().bucketName;
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;

  if (metadata?.httpStatusCode === 404) {
    return true;
  }

  const name = (error as { name?: string }).name;

  return name === 'NotFound' || name === 'NoSuchKey';
}

export async function r2ObjectExists(storagePath: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      }),
    );

    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

export async function createR2UploadUrl(
  storagePath: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: storagePath,
      ContentType: contentType,
    }),
    { expiresIn: FILM_UPLOAD_URL_TTL_SECONDS },
  );
}

export async function createR2DownloadUrl(storagePath: string): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: storagePath,
    }),
    { expiresIn: FILM_SIGNED_URL_TTL_SECONDS },
  );
}

export async function deleteR2Object(storagePath: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      }),
    );

    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}
