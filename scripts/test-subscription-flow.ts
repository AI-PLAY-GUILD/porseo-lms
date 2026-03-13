import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const SECRET = process.env.CONVEX_INTERNAL_SECRET || "";

if (!CONVEX_URL || !SECRET) {
    console.error("Missing CONVEX_URL or CONVEX_INTERNAL_SECRET in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

import { api } from "../convex/_generated/api.js";

async function runTest() {
    console.log("=== Stripe Webhook Subscription Lifecycle Simulation ===");

    // 1. Prepare Test Data
    const testClerkId = "user_e2e_test_" + Date.now();
    const testDiscordId = "1234567890123456789"; // Dummy Discord ID
    const testStripeCustomerId = "cus_test_" + Date.now();

    console.log("\n[Step 1] Creating a test user via Convex mutation...");
    const userId = await client.mutation(api.users.webhookSyncUser, {
        clerkId: testClerkId,
        email: `test_${Date.now()}@example.com`,
        name: "Webhook Test User",
        secret: SECRET,
    });
    console.log(`✅ User created. ID: ${userId}`);

    // Set Discord ID directly via mutation to simulate OAuth connection
    await client.mutation(api.users.setDiscordIdByClerkId, {
        clerkId: testClerkId,
        discordId: testDiscordId,
        secret: SECRET,
    });
    console.log(`✅ Discord ID (${testDiscordId}) linked to user.`);

    let user = await client.query(api.users.getUserByClerkIdServer, {
        clerkId: testClerkId,
        secret: SECRET,
    });
    console.log(`Current Status: ${user?.subscriptionStatus || "unpaid"}, Roles: ${user?.discordRoles?.length}`);

    // 2. Simulate Checkout Session Completed (Subscribe)
    console.log("\n[Step 2] Simulating checkout.session.completed (User Subscribes)...");
    await client.mutation(api.users.updateSubscriptionStatus, {
        discordId: testDiscordId,
        stripeCustomerId: testStripeCustomerId,
        subscriptionStatus: "active",
        subscriptionName: "Premium Test Plan",
        roleId: "test_role_999", // Dummy Discord Role
        secret: SECRET,
    });

    user = await client.query(api.users.getUserByClerkIdServer, {
        clerkId: testClerkId,
        secret: SECRET,
    });
    console.log(`✅ Subscription marked as active.`);
    console.log(`Current Status: ${user?.subscriptionStatus}, Roles: ${user?.discordRoles?.join(", ")}`);
    console.log(`Stripe Customer ID set: ${user?.stripeCustomerId === testStripeCustomerId}`);

    if (user?.subscriptionStatus !== "active") {
        throw new Error("❌ Failed: Status is not active");
    }

    // 3. Simulate Payment Failure (Optional mid-lifecycle event)
    console.log("\n[Step 3] Simulating invoice.payment_failed...");
    await client.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: testStripeCustomerId,
        subscriptionStatus: "past_due",
        secret: SECRET,
    });

    user = await client.query(api.users.getUserByClerkIdServer, {
        clerkId: testClerkId,
        secret: SECRET,
    });
    console.log(`✅ Subscription marked as past_due.`);
    console.log(`Current Status: ${user?.subscriptionStatus}`);

    if (user?.subscriptionStatus !== "past_due") {
        throw new Error("❌ Failed: Status is not past_due");
    }

    // 4. Simulate Subscription Deleted (User Cancels)
    console.log("\n[Step 4] Simulating customer.subscription.deleted (User Cancels)...");
    await client.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: testStripeCustomerId,
        subscriptionStatus: "canceled",
        secret: SECRET,
    });

    user = await client.query(api.users.getUserByClerkIdServer, {
        clerkId: testClerkId,
        secret: SECRET,
    });
    console.log(`✅ Subscription marked as canceled.`);
    console.log(`Final Status: ${user?.subscriptionStatus}`);

    if (user?.subscriptionStatus !== "canceled") {
        throw new Error("❌ Failed: Status is not canceled");
    }

    console.log("\n🎉 All Stripe lifecycle webhook simulations passed successfully!");
}

runTest().catch(console.error);
