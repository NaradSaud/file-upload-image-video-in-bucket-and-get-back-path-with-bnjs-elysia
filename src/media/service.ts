import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import { ThumbnailService, ThumbnailResult } from "./thumbnail";
import path from "path";

const BUCKET = process.env.DO_SPACES_BUCKET!;
const BUCKET_URL = process.env.BUCKET_URL!;

export interface UploadResult {
  url: string;
  thumbnails?: ThumbnailResult['thumbnails'];
  type: 'image' | 'video' | 'other';
  metadata?: ThumbnailResult['metadata'];
}

export class MediaService {
  // Define allowed file types
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
  ];

  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // .avi
    'video/x-ms-wmv',  // .wmv
    'video/webm',
    'video/ogg'
  ];

  // Validate file type
  private static isValidFileType(file: File): boolean {
    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);
    return isImage || isVideo;
  }

  // Get file category
  private static getFileCategory(file: File): 'image' | 'video' | 'unknown' {
    if (this.ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
    if (this.ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
    return 'unknown';
  }

  // Upload single file with thumbnail generation
  static async uploadSingle(file: File, folder: string): Promise<string> {
    try {
      // Validate file type
      if (!this.isValidFileType(file)) {
        const allowedTypes = [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES];
        throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      console.log(`Uploading ${this.getFileCategory(file)}: ${file.name} (${file.type})`);

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

  // Upload single file with thumbnail generation (enhanced version)
  static async uploadSingleWithThumbnails(file: File, folder: string): Promise<UploadResult> {
    try {
      // Validate file type
      if (!this.isValidFileType(file)) {
        const allowedTypes = [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES];
        throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      console.log(`Uploading ${this.getFileCategory(file)}: ${file.name} (${file.type})`);

      const buffer = Buffer.from(await file.arrayBuffer());

      // Sanitize filename: remove spaces, special characters, and make it URL-safe
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_')           // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except dots, underscores, hyphens
        .toLowerCase();                  // Convert to lowercase

      const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

      // Upload original file
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileName,
          Body: buffer,
          ACL: "public-read",
          ContentType: file.type,
        })
      );

      const originalUrl = `${BUCKET_URL}/${fileName}`;
      const fileCategory = this.getFileCategory(file);

      // Generate thumbnails if supported
      let thumbnailResult: ThumbnailResult | null = null;
      if (ThumbnailService.supportsThumbnails(file.type)) {
        try {
          console.log(`🖼️ Generating thumbnails for ${file.name}...`);
          thumbnailResult = await ThumbnailService.generateThumbnails(file, folder, path.basename(fileName));
          console.log(`✅ Thumbnails generated successfully for ${file.name}`);
        } catch (thumbnailError) {
          console.error(`⚠️ Thumbnail generation failed for ${file.name}:`, thumbnailError);
          // Continue without thumbnails - don't fail the main upload
        }
      }

      return {
        url: originalUrl,
        thumbnails: thumbnailResult?.thumbnails,
        type: fileCategory as 'image' | 'video' | 'other',
        metadata: thumbnailResult?.metadata
      };

    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("File upload failed");
    }
  }

  // Upload multiple files
  static async uploadMultiple(files: File[], folder: string): Promise<string[]> {
    // Validate all files first
    const invalidFiles = files.filter(file => !this.isValidFileType(file));

    if (invalidFiles.length > 0) {
      const invalidFileInfo = invalidFiles.map(file => `${file.name} (${file.type})`).join(', ');
      throw new Error(`Invalid file types found: ${invalidFileInfo}. Only images and videos are allowed.`);
    }

    console.log(`Uploading ${files.length} files to folder: ${folder}`);
    files.forEach(file => {
      console.log(`- ${file.name} (${file.type}) - ${this.getFileCategory(file)}`);
    });

    return Promise.all(files.map((file) => this.uploadSingle(file, folder)));
  }

  // Upload multiple files with thumbnail generation
  static async uploadMultipleWithThumbnails(files: File[], folder: string): Promise<UploadResult[]> {
    // Validate all files first
    const invalidFiles = files.filter(file => !this.isValidFileType(file));

    if (invalidFiles.length > 0) {
      const invalidFileInfo = invalidFiles.map(file => `${file.name} (${file.type})`).join(', ');
      throw new Error(`Invalid file types found: ${invalidFileInfo}. Only images and videos are allowed.`);
    }

    console.log(`Uploading ${files.length} files with thumbnails to folder: ${folder}`);
    files.forEach(file => {
      console.log(`- ${file.name} (${file.type}) - ${this.getFileCategory(file)}`);
    });

    return Promise.all(files.map((file) => this.uploadSingleWithThumbnails(file, folder)));
  }

  // Get allowed file types for API documentation
  static getAllowedFileTypes(): { images: string[], videos: string[] } {
    return {
      images: [...this.ALLOWED_IMAGE_TYPES],
      videos: [...this.ALLOWED_VIDEO_TYPES]
    };
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
