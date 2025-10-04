import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";

const BUCKET = process.env.DO_SPACES_BUCKET!;
const BUCKET_URL = process.env.BUCKET_URL!;

export class MediaService {
  // Upload single file
  static async uploadSingle(file: File, folder: string): Promise<string> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Sanitize filename: remove spaces, special characters, and make it URL-safe
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_')           // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except dots, underscores, hyphens
        .toLowerCase();                  // Convert to lowercase

      const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileName,
          Body: buffer,
          ACL: "public-read",
          ContentType: file.type,
        })
      );

      return `${BUCKET_URL}/${fileName}`;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("File upload failed");
    }
  }

  // Upload multiple files
  static async uploadMultiple(files: File[], folder: string): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadSingle(file, folder)));
  }

  // Get public URL of a file
  static getFileUrl(path: string): string {
    return `${BUCKET_URL}/${path}`;
  }

  // Delete a file
  static async deleteFile(path: string): Promise<boolean> {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: path, // e.g. "users/123-profile.png"
        })
      );
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  }

  // Add images to an existing list
  static async addImages(existing: string[], files: File[], folder: string): Promise<string[]> {
    const newImages = await this.uploadMultiple(files, folder);
    return [...existing, ...newImages];
  }
}
