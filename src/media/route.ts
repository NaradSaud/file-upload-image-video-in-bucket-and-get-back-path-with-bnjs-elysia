import { Elysia } from "elysia";
import { MediaService } from "./service";

export const mediaRoutes = (app: Elysia) =>
  app.group("/media", (app) =>
    app
      // Upload single image
      .post("/upload", async ({ body }) => {
        const { file, folder } = body as { file: File; folder: string };
        const url = await MediaService.uploadSingle(file, folder);
        return { success: true, url };
      })

      // Upload multiple images
      .post("/upload-multiple", async ({ body }) => {
        const { files, folder } = body as { files: File[]; folder: string };
        const urls = await MediaService.uploadMultiple(files, folder);
        return { success: true, urls };
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
