import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'pdftolink-uploads';
const S3_REGION = process.env.AWS_REGION || 'us-east-1';
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour for upload URLs
const DOWNLOAD_URL_EXPIRY = 300; // 5 minutes for download URLs

// Initialize S3 Client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Use default credential chain if not specified
});

/**
 * Check if S3 is configured and available
 */
export function isS3Configured() {
  return !!(process.env.AWS_S3_BUCKET && (
    process.env.AWS_ACCESS_KEY_ID || 
    process.env.AWS_PROFILE ||
    process.env.AWS_ROLE_ARN
  ));
}

/**
 * Generate a presigned URL for uploading a PDF
 * Client uploads directly to S3, bypassing our server
 * 
 * @param {string} documentId - Unique document identifier
 * @param {string} fileName - Original filename
 * @param {string} contentType - MIME type (should be application/pdf)
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
export async function getPresignedUploadUrl(documentId, fileName, contentType = 'application/pdf') {
  const key = `pdfs/${documentId}/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    // Set expiration tag for lifecycle policy
    Tagging: 'AutoExpire=true',
    Metadata: {
      'original-filename': fileName,
      'document-id': documentId,
      'uploaded-at': new Date().toISOString(),
    },
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });
  
  return { uploadUrl, key };
}

/**
 * Generate a presigned URL for downloading/viewing a PDF
 * 
 * @param {string} key - S3 object key
 * @param {string} fileName - Original filename for Content-Disposition
 * @param {boolean} inline - Whether to display inline (true) or download (false)
 * @returns {Promise<string>}
 */
export async function getPresignedDownloadUrl(key, fileName, inline = true) {
  const disposition = inline 
    ? `inline; filename="${fileName}"` 
    : `attachment; filename="${fileName}"`;
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: disposition,
    ResponseContentType: 'application/pdf',
  });
  
  return getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  });
}

/**
 * Upload a PDF buffer directly to S3
 * Used when receiving file through our server
 * 
 * @param {string} documentId 
 * @param {string} fileName 
 * @param {Buffer} fileBuffer 
 * @returns {Promise<{key: string, size: number}>}
 */
export async function uploadPDFToS3(documentId, fileName, fileBuffer) {
  const key = `pdfs/${documentId}/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/pdf',
    Tagging: 'AutoExpire=true',
    Metadata: {
      'original-filename': fileName,
      'document-id': documentId,
      'uploaded-at': new Date().toISOString(),
    },
  });
  
  await s3Client.send(command);
  
  return { key, size: fileBuffer.length };
}

/**
 * Get PDF from S3 as a stream
 * 
 * @param {string} key - S3 object key
 * @returns {Promise<{stream: ReadableStream, contentLength: number, contentType: string}>}
 */
export async function getPDFStream(key) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  
  return {
    stream: response.Body,
    contentLength: response.ContentLength,
    contentType: response.ContentType,
    metadata: response.Metadata,
  };
}

/**
 * Check if a PDF exists in S3
 * 
 * @param {string} key 
 * @returns {Promise<{exists: boolean, size?: number}>}
 */
export async function checkPDFExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    return { exists: true, size: response.ContentLength };
  } catch (err) {
    if (err.name === 'NotFound') {
      return { exists: false };
    }
    throw err;
  }
}

/**
 * Delete a PDF from S3
 * 
 * @param {string} key 
 */
export async function deletePDFFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  
  await s3Client.send(command);
}

/**
 * Delete all files for a document
 * 
 * @param {string} documentId 
 */
export async function deleteDocumentFiles(documentId) {
  const prefix = `pdfs/${documentId}/`;
  
  // List all objects with this prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: prefix,
  });
  
  const listResponse = await s3Client.send(listCommand);
  
  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    return;
  }
  
  // Delete each object
  for (const obj of listResponse.Contents) {
    await deletePDFFromS3(obj.Key);
  }
}

/**
 * Get the S3 key for a document
 * 
 * @param {string} documentId 
 * @param {string} fileName 
 * @returns {string}
 */
export function getS3Key(documentId, fileName) {
  return `pdfs/${documentId}/${fileName}`;
}

export { S3_BUCKET, S3_REGION };
