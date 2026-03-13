import { createServiceClient } from "@/lib/supabase/server";

// Supabase Storage buckets (create these in Supabase dashboard)
export const BUCKETS = {
  ebooks: "ebooks",
  covers: "covers",
  knowledge: "knowledge",
} as const;

type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Upload a file to Supabase Storage.
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ publicUrl: string; path: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { publicUrl: urlData.publicUrl, path };
}

/**
 * Get a signed download URL for a private file.
 */
export async function getSignedDownloadUrl(
  bucket: BucketName,
  path: string,
  expiresIn = 86400
): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * Create a signed upload URL for client-side uploads.
 */
export async function getSignedUploadUrl(
  bucket: BucketName,
  path: string
): Promise<{ signedUrl: string; path: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? "Unknown error"}`);
  }

  return { signedUrl: data.signedUrl, path: data.path };
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

/**
 * Get the public URL for a file (for public buckets).
 */
export function getPublicUrl(
  bucket: BucketName,
  path: string
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
