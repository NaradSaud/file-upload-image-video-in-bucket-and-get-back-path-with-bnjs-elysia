import { Elysia } from "elysia";
import { MediaService } from "./service";

export const mediaRoutes = (app: Elysia) =>
  app.group("/media", (app) =>
    app
      // Upload single image
      .post("/upload", async ({ body }) => {
        try {
          const { file, folder } = body as { file: File; folder: string };

          if (!file) {
            return { success: false, error: "No file provided" };
          }

          if (!folder) {
            return { success: false, error: "Folder is required" };
          }

          const url = await MediaService.uploadSingle(file, folder);
          return { success: true, url };
        } catch (error) {
          console.error("Single upload error:", error);
          const errorMessage = error instanceof Error ? error.message : "File upload failed";
          return { success: false, error: errorMessage };
        }
      })

      // Upload multiple images
      .post("/upload-multiple", async ({ body }) => {
        try {
          console.log("Multiple upload request body:", body);
          const { files, folder } = body as { files: File[]; folder: string };

          if (!files || !Array.isArray(files) || files.length === 0) {
            return { success: false, error: "No files provided or files is not an array" };
          }

          if (!folder) {
            return { success: false, error: "Folder is required" };
          }

          console.log(`Uploading ${files.length} files to folder: ${folder}`);
          const urls = await MediaService.uploadMultiple(files, folder);
          return { success: true, urls, count: urls.length };
        } catch (error) {
          console.error("Multiple upload error:", error);
          const errorMessage = error instanceof Error ? error.message : "Multiple file upload failed";
          return { success: false, error: errorMessage };
        }
      })

      // Get allowed file types
      .get("/allowed-types", async () => {
        return {
          success: true,
          allowedTypes: MediaService.getAllowedFileTypes()
        };
      })

      // Delete image
      .delete("/delete", async ({ body }) => {
        const { path } = body as { path: string };
        const result = await MediaService.deleteFile(path);
        return { success: result };
      })

      // Get image URL
      .get("/get/:path", async ({ params }) => {
        return { url: MediaService.getFileUrl(params.path) };
      })
  );
