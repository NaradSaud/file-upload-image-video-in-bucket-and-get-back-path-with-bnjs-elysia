import { Elysia } from "elysia";
import { db } from "../db/client";
import { people } from "../db/schema";
import { eq } from "drizzle-orm";
import { MediaService } from "../media/service";

export const userRoutes = (app: Elysia) =>
  app.group("/users", (app) =>
    app
      // Register a new user
      .post("/register", async ({ body }) => {
        try {
          const { name, file } = body as { name: string; file?: File };

          if (!name) {
            return { success: false, error: "Name is required" };
          }

          const imageUrl = file ? await MediaService.uploadSingle(file, "users") : null;

          const [newUser] = await db
            .insert(people)
            .values({ name, profileImage: imageUrl || undefined })
            .returning();

          return {
            success: true,
            data: {
              user: newUser,
              hasProfileImage: !!imageUrl
            }
          };
        } catch (error) {
          console.error("Error registering user:", error);
          return { success: false, error: "Failed to register user" };
        }
      })

      // Get all users
      .get("/", async () => {
        try {
          const allUsers = await db.select().from(people);
          return {
            success: true,
            data: {
              users: allUsers,
              count: allUsers.length
            }
          };
        } catch (error) {
          console.error("Error fetching users:", error);
          return { success: false, error: "Failed to fetch users" };
        }
      })

      // Get user by ID
      .get("/:id", async ({ params }) => {
        try {
          const userId = parseInt(params.id);
          const [userData] = await db.select().from(people).where(eq(people.id, userId));

          if (!userData) {
            return { success: false, error: "User not found" };
          }

          return { success: true, data: { user: userData } };
        } catch (error) {
          console.error("Error fetching user:", error);
          return { success: false, error: "Failed to fetch user" };
        }
      })

      // Update user profile image
      .patch("/:id/profile-image", async ({ params, body }) => {
        try {
          const userId = parseInt(params.id);
          const { file } = body as { file: File };

          if (!file) {
            return { success: false, error: "File is required" };
          }

          const imageUrl = await MediaService.uploadSingle(file, "users");

          const [updatedUser] = await db
            .update(people)
            .set({ profileImage: imageUrl })
            .where(eq(people.id, userId))
            .returning();

          if (!updatedUser) {
            return { success: false, error: "User not found" };
          }

          return {
            success: true,
            data: {
              user: updatedUser,
              newImageUrl: imageUrl
            }
          };
        } catch (error) {
          console.error("Error updating profile image:", error);
          return { success: false, error: "Failed to update profile image" };
        }
      })
  );
