// Test script to verify API endpoints
// Run with: bun run test-api.ts

const BASE_URL = "http://localhost:3000";

async function testAPI() {
    console.log("🧪 Testing API endpoints...\n");

    try {
        // Test 1: Get all users (should return empty array initially)
        console.log("1. Testing GET /users/");
        const usersResponse = await fetch(`${BASE_URL}/users/`);
        const usersData = await usersResponse.json();
        console.log("✅ Users response:", JSON.stringify(usersData, null, 2));

        // Test 2: Get all homes (should return empty array initially)
        console.log("\n2. Testing GET /homes/");
        const homesResponse = await fetch(`${BASE_URL}/homes/`);
        const homesData = await homesResponse.json();
        console.log("✅ Homes response:", JSON.stringify(homesData, null, 2));

        // Test 3: Test media endpoints (get non-existent file)
        console.log("\n3. Testing GET /media/get/test-path");
        const mediaResponse = await fetch(`${BASE_URL}/media/get/test-path`);
        const mediaData = await mediaResponse.json();
        console.log("✅ Media response:", JSON.stringify(mediaData, null, 2));

        console.log("\n🎉 All basic API tests completed successfully!");
        console.log("\n📖 For full API documentation, see API_DOCUMENTATION.md");

    } catch (error) {
        console.error("❌ API test failed:", error);
    }
}

// Run the tests
testAPI();