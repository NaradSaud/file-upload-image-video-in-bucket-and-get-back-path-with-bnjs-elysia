import { pgTable, PgTable, serial, text, varchar } from "drizzle-orm/pg-core";


export const people = pgTable("people", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    profileImage: text("profile_image")
});

export const homes = pgTable("homes", {
    id: serial("id").primaryKey(),
    ownerId: serial("owner_id").notNull(),
    address: varchar("address", { length: 512 }).notNull(),
    images: text("images").array()
});