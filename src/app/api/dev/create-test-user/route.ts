import crypto from "node:crypto";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 開発環境専用 - テストユーザーを自動作成
export async function POST(req: Request) {
    // 本番環境では完全にブロック
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 開発環境でも認証必須
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { role } = body as { role?: "user" | "admin" };
        const clerk = await clerkClient();

        const randomId = crypto.randomBytes(4).toString("hex");
        const email = `dev-${role || "user"}-${randomId}@example.com`;
        // ランダムパスワードを生成（ハードコード回避）
        const password = crypto.randomBytes(16).toString("base64url");
        const firstName = role === "admin" ? "テスト管理者" : "テストユーザー";

        const user = await clerk.users.createUser({
            emailAddress: [email],
            password,
            firstName,
            lastName: "Dev",
            skipPasswordChecks: true,
        });

        return NextResponse.json({
            email,
            password,
            clerkId: user.id,
            name: `${firstName} Dev`,
        });
    } catch (err: unknown) {
        console.error("[dev/create-test-user] エラー:", err);
        return NextResponse.json({ error: "Failed to create test user" }, { status: 500 });
    }
}
