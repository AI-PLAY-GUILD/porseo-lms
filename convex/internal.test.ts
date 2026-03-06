import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

describe("batchMigrateUsers", () => {
    it("Clerk IDありのユーザーを新規作成できる", async () => {
        const t = convexTest(schema, modules);
        const result = await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "test@example.com",
                    clerkId: "clerk_123",
                    stripeCustomerId: "cus_123",
                    name: "Test User",
                    subscriptionStatus: "active",
                },
            ],
        });
        expect(result.success).toBe(1);
        expect(result.failed).toBe(0);

        // DBに正しく保存されたか確認
        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk_123"))
                .first();
        });
        expect(user).not.toBeNull();
        expect(user!.email).toBe("test@example.com");
        expect(user!.stripeCustomerId).toBe("cus_123");
        expect(user!.subscriptionStatus).toBe("active");
    });

    it("Clerk IDなし（Wix移行）のユーザーはプレースホルダーIDで作成される", async () => {
        const t = convexTest(schema, modules);
        const result = await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "wix-user@example.com",
                    stripeCustomerId: "cus_wix_456",
                    name: "Wix User",
                },
            ],
        });
        expect(result.success).toBe(1);
        expect(result.failed).toBe(0);

        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", "wix-user@example.com"))
                .first();
        });
        expect(user).not.toBeNull();
        expect(user!.clerkId).toBe("wix_migration:wix-user@example.com");
        expect(user!.stripeCustomerId).toBe("cus_wix_456");
        expect(user!.isAdmin).toBe(false);
        expect(user!.discordRoles).toEqual([]);
    });

    it("既存ユーザー（Clerk ID一致）はstripeCustomerIdが更新される", async () => {
        const t = convexTest(schema, modules);

        // 既存ユーザーを先に作成
        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "clerk_existing",
                email: "existing@example.com",
                name: "Existing User",
                discordRoles: [],
                isAdmin: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "existing@example.com",
                    clerkId: "clerk_existing",
                    stripeCustomerId: "cus_new_789",
                    name: "Existing User",
                },
            ],
        });
        expect(result.success).toBe(1);

        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk_existing"))
                .first();
        });
        expect(user!.stripeCustomerId).toBe("cus_new_789");
        expect(user!.subscriptionStatus).toBe("active");
    });

    it("既存ユーザー（メール一致、Wix移行ケース）はstripeCustomerIdが更新される", async () => {
        const t = convexTest(schema, modules);

        // Wix移行済みユーザーを先に作成
        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "wix_migration:wix-existing@example.com",
                email: "wix-existing@example.com",
                name: "Wix Existing",
                stripeCustomerId: "cus_old",
                subscriptionStatus: "active",
                discordRoles: [],
                isAdmin: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "wix-existing@example.com",
                    stripeCustomerId: "cus_updated",
                    name: "Wix Existing",
                },
            ],
        });
        expect(result.success).toBe(1);

        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", "wix-existing@example.com"))
                .first();
        });
        expect(user!.stripeCustomerId).toBe("cus_updated");
    });

    it("subscriptionStatusが未指定の場合はactiveがデフォルトになる", async () => {
        const t = convexTest(schema, modules);
        await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "no-status@example.com",
                    stripeCustomerId: "cus_no_status",
                    name: "No Status User",
                },
            ],
        });

        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", "no-status@example.com"))
                .first();
        });
        expect(user!.subscriptionStatus).toBe("active");
    });

    it("複数ユーザーを一括で移行できる", async () => {
        const t = convexTest(schema, modules);
        const result = await t.mutation(internal.internal.batchMigrateUsers, {
            users: [
                {
                    email: "user1@example.com",
                    clerkId: "clerk_1",
                    stripeCustomerId: "cus_1",
                    name: "User 1",
                },
                {
                    email: "user2@example.com",
                    stripeCustomerId: "cus_2",
                    name: "User 2",
                },
                {
                    email: "user3@example.com",
                    clerkId: "clerk_3",
                    stripeCustomerId: "cus_3",
                    name: "User 3",
                    subscriptionStatus: "canceled",
                },
            ],
        });
        expect(result.success).toBe(3);
        expect(result.failed).toBe(0);
    });
});

describe("adminLinkStripeByEmail", () => {
    it("メールアドレスでStripe顧客IDを紐付けできる", async () => {
        const t = convexTest(schema, modules);

        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "clerk_link_test",
                email: "link-test@example.com",
                name: "Link Test",
                discordRoles: [],
                isAdmin: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const result = await t.mutation(internal.internal.adminLinkStripeByEmail, {
            email: "link-test@example.com",
            stripeCustomerId: "cus_linked",
        });
        expect(result.success).toBe(true);
        expect(result.message).toContain("紐付け完了");

        const user = await t.run(async (ctx) => {
            return await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", "link-test@example.com"))
                .first();
        });
        expect(user!.stripeCustomerId).toBe("cus_linked");
    });

    it("存在しないメールアドレスの場合はエラーを返す", async () => {
        const t = convexTest(schema, modules);
        const result = await t.mutation(internal.internal.adminLinkStripeByEmail, {
            email: "nonexistent@example.com",
            stripeCustomerId: "cus_none",
        });
        expect(result.success).toBe(false);
        expect(result.message).toContain("ユーザーが見つかりません");
    });
});

describe("adminGetUserByEmail", () => {
    it("メールアドレスでユーザーを取得できる", async () => {
        const t = convexTest(schema, modules);

        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "clerk_query_test",
                email: "query-test@example.com",
                name: "Query Test",
                discordRoles: [],
                isAdmin: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        const user = await t.query(internal.internal.adminGetUserByEmail, {
            email: "query-test@example.com",
        });
        expect(user).not.toBeNull();
        expect(user!.name).toBe("Query Test");
    });

    it("存在しないメールアドレスの場合はnullを返す", async () => {
        const t = convexTest(schema, modules);
        const user = await t.query(internal.internal.adminGetUserByEmail, {
            email: "no-one@example.com",
        });
        expect(user).toBeNull();
    });
});
