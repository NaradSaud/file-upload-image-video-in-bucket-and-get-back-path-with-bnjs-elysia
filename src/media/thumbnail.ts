import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

const BUCKET = process.env.DO_SPACES_BUCKET!;
const BUCKET_URL = process.env.BUCKET_URL!;

export interface ThumbnailConfig {
    width: number;
    height: number;
    quality: number;
    suffix: string;
}

export interface ThumbnailResult {
    originalUrl: string;
    thumbnails: {
        small: string;
        medium: string;
        large: string;
    };
    type: 'image' | 'video';
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
    };
}

export class ThumbnailService {
    // Thumbnail configurations
    private static readonly THUMBNAIL_CONFIGS: Record<string, ThumbnailConfig> = {
        small: { width: 150, height: 150, quality: 80, suffix: '_thumb_sm' },
        medium: { width: 300, height: 300, quality: 85, suffix: '_thumb_md' },
        large: { width: 600, height: 600, quality: 90, suffix: '_thumb_lg' }
    };

    // Image formats that support thumbnail generation
    private static readonly SUPPORTED_IMAGE_FORMATS = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'
    ];

    // Video formats that support thumbnail generation
    private static readonly SUPPORTED_VIDEO_FORMATS = [
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    /**
     * Generate thumbnails for a file (image or video)
     */
    static async generateThumbnails(
        file: File,
        folder: string,
        originalFileName: string
    ): Promise<ThumbnailResult> {
        const isImage = this.SUPPORTED_IMAGE_FORMATS.includes(file.type);
        const isVideo = this.SUPPORTED_VIDEO_FORMATS.includes(file.type);

        if (!isImage && !isVideo) {
            throw new Error(`Thumbnail generation not supported for file type: ${file.type}`);
        }

        console.log(`🖼️ Generating thumbnails for ${isImage ? 'image' : 'video'}: ${file.name}`);

        if (isImage) {
            return await this.generateImageThumbnails(file, folder, originalFileName);
        } else {
            return await this.generateVideoThumbnails(file, folder, originalFileName);
        }
    }

    /**
     * Generate thumbnails for images using Sharp
     */
    private static async generateImageThumbnails(
        file: File,
        folder: string,
        originalFileName: string
    ): Promise<ThumbnailResult> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const image = sharp(buffer);
        const metadata = await image.metadata();

        console.log(`📷 Image metadata:`, {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
        });

        const thumbnails: Record<string, string> = {};
        const baseFileName = this.getBaseFileName(originalFileName);

        // Generate thumbnails for each size
        for (const [size, config] of Object.entries(this.THUMBNAIL_CONFIGS)) {
            try {
                const thumbnailBuffer = await image
                    .resize(config.width, config.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: config.quality })
                    .toBuffer();

                const thumbnailFileName = `${folder}/thumbnails/${baseFileName}${config.suffix}.jpg`;
                const thumbnailUrl = await this.uploadThumbnailToS3(thumbnailBuffer, thumbnailFileName);

                thumbnails[size] = thumbnailUrl;
                console.log(`✅ Generated ${size} thumbnail: ${thumbnailFileName}`);
            } catch (error) {
                console.error(`❌ Error generating ${size} thumbnail:`, error);
                throw error;
            }
        }

        return {
            originalUrl: `${BUCKET_URL}/${folder}/${originalFileName}`,
            thumbnails: thumbnails as ThumbnailResult['thumbnails'],
            type: 'image',
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            }
        };
    }

    /**
     * Generate thumbnails for videos using FFmpeg
     */
    private static async generateVideoThumbnails(
        file: File,
        folder: string,
        originalFileName: string
    ): Promise<ThumbnailResult> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempVideoPath = `/tmp/video_${Date.now()}.${this.getFileExtension(file.name)}`;
        const tempThumbnailPath = `/tmp/thumb_${Date.now()}.jpg`;

        try {
            // Write video buffer to temporary file
            await fs.promises.writeFile(tempVideoPath, buffer);

            // Get video metadata
            const metadata = await this.getVideoMetadata(tempVideoPath);
            console.log(`🎥 Video metadata:`, metadata);

            // Generate a single frame from video at 1 second (or 10% of duration)
            const timePosition = Math.min(1, (metadata.duration || 10) * 0.1);

            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempVideoPath)
                    .screenshots({
                        timestamps: [timePosition],
                        filename: path.basename(tempThumbnailPath),
                        folder: path.dirname(tempThumbnailPath),
                        size: '1280x720'
                    })
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err));
            });

            // Read the generated thumbnail
            const thumbnailBuffer = await fs.promises.readFile(tempThumbnailPath);

            // Generate different sized thumbnails from the extracted frame
            const thumbnails: Record<string, string> = {};
            const baseFileName = this.getBaseFileName(originalFileName);

            for (const [size, config] of Object.entries(this.THUMBNAIL_CONFIGS)) {
                try {
                    const resizedThumbnail = await sharp(thumbnailBuffer)
                        .resize(config.width, config.height, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: config.quality })
                        .toBuffer();

                    const thumbnailFileName = `${folder}/thumbnails/${baseFileName}${config.suffix}.jpg`;
                    const thumbnailUrl = await this.uploadThumbnailToS3(resizedThumbnail, thumbnailFileName);

                    thumbnails[size] = thumbnailUrl;
                    console.log(`✅ Generated ${size} video thumbnail: ${thumbnailFileName}`);
                } catch (error) {
                    console.error(`❌ Error generating ${size} video thumbnail:`, error);
                    throw error;
                }
            }

            return {
                originalUrl: `${BUCKET_URL}/${folder}/${originalFileName}`,
                thumbnails: thumbnails as ThumbnailResult['thumbnails'],
                type: 'video',
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    duration: metadata.duration,
                    format: metadata.format
                }
            };

        } finally {
            // Cleanup temporary files
            try {
                await fs.promises.unlink(tempVideoPath);
                await fs.promises.unlink(tempThumbnailPath);
            } catch (error) {
                console.warn('⚠️ Error cleaning up temporary files:', error);
            }
        }
    }

    /**
     * Get video metadata using FFprobe
     */
    private static async getVideoMetadata(videoPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else {
                    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                    resolve({
                        duration: metadata.format?.duration,
                        width: videoStream?.width,
                        height: videoStream?.height,
                        format: metadata.format?.format_name
                    });
                }
            });
        });
    }

    /**
     * Upload thumbnail buffer to S3
     */
    private static async uploadThumbnailToS3(buffer: Buffer, fileName: string): Promise<string> {
        try {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: fileName,
                    Body: buffer,
                    ACL: "public-read",
                    ContentType: "image/jpeg",
                })
            );

            return `${BUCKET_URL}/${fileName}`;
        } catch (error) {
            console.error('❌ Error uploading thumbnail to S3:', error);
            throw new Error('Failed to upload thumbnail');
        }
    }

    /**
     * Get base filename without extension
     */
    private static getBaseFileName(fileName: string): string {
        return path.parse(fileName).name;
    }

    /**
     * Get file extension
     */
    private static getFileExtension(fileName: string): string {
        return path.extname(fileName).slice(1);
    }

    /**
     * Check if file supports thumbnail generation
     */
    static supportsThumbnails(fileType: string): boolean {
        return this.SUPPORTED_IMAGE_FORMATS.includes(fileType) ||
            this.SUPPORTED_VIDEO_FORMATS.includes(fileType);
    }

    /**
     * Get thumbnail folder structure for a given folder
     */
    static getThumbnailFolder(baseFolder: string): string {
        return `${baseFolder}/thumbnails`;
    }
}