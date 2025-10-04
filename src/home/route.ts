import { Elysia } from "elysia";
import { db } from "../db/client";
import { homes } from "../db/schema";
import { eq } from "drizzle-orm";
import { MediaService } from "../media/service";

export const homeRoutes = (app: Elysia) =>
  app.group("/homes", (app) =>
    app
      // Create a new home with images
      .post("/create", async ({ body }) => {
        try {
          console.log("Home creation request body:", body);

          const requestBody = body as any;
          const ownerId = parseInt(requestBody.ownerId);
          const address = requestBody.address;

          // Handle both 'file' and 'files' field names
          let files = requestBody.files || requestBody.file;

          // If single file, convert to array
          if (files && !Array.isArray(files)) {
            files = [files];
          }

          console.log("Parsed data:", {
            ownerId,
            address,
            filesCount: files ? files.length : 0,
            files: files ? files.map((f: any) => ({ name: f.name, type: f.type })) : []
          });

          if (!ownerId || !address) {
            return { success: false, error: "ownerId and address are required" };
          }

          let imageUrls: string[] = [];

          if (files && files.length > 0) {
            console.log(`Uploading ${files.length} files...`);
            imageUrls = await MediaService.uploadMultiple(files, "homes");
            console.log("Upload successful, URLs:", imageUrls);
          } else {
            console.log("No files to upload");
          }

          const [newHome] = await db
            .insert(homes)
            .values({ ownerId, address, images: imageUrls })
            .returning();

          return {
            success: true,
            data: {
              home: newHome,
              imageCount: imageUrls.length,
              imageUrls
            }
          };
        } catch (error) {
          console.error("Error creating home:", error);
          return { success: false, error: "Failed to create home" };
        }
      })

      // Get all homes
      .get("/", async () => {
        try {
          const allHomes = await db.select().from(homes);
          return {
            success: true,
            data: {
              homes: allHomes,
              count: allHomes.length
            }
          };
        } catch (error) {
          console.error("Error fetching homes:", error);
          return { success: false, error: "Failed to fetch homes" };
        }
      })

      // Get home by ID
      .get("/:id", async ({ params }) => {
        try {
          const homeId = parseInt(params.id);
          const [home] = await db.select().from(homes).where(eq(homes.id, homeId));

          if (!home) {
            return { success: false, error: "Home not found" };
          }

          return { success: true, data: { home } };
        } catch (error) {
          console.error("Error fetching home:", error);
          return { success: false, error: "Failed to fetch home" };
        }
      })
  );
