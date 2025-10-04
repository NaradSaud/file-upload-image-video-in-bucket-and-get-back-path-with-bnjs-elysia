import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";


//connect to postgres
//client means raw postgres connecton created by postgres library it is variable
const client = postgres(process.env.DATABASE_URL!);


//here db means the drizzle instance, which you use to interact with tables
export const db = drizzle(client)

// Test database connection
export async function testDbConnection() {
    try {
        // Test the connection by running a simple query
        await client`SELECT 1 as test`;
        console.log("✅ Database connected successfully!");
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
}