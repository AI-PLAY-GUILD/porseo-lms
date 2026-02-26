import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 開発環境専用 - テストユーザーを自動作成
export async function POST(req: Request) {
    console.log("[dev/create-test-user] リクエスト受信");

    if (process.env.NODE_ENV !== "development") {
        console.log("[dev/create-test-user] 本番環境のためブロック");
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    try {
        const body = await req.json();
        console.log("[dev/create-test-user] リクエストbody:", body);

        const { role } = body as { role?: "user" | "admin" };
        const clerk = await clerkClient();

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const email = `dev-${role || "user"}-${randomId}@example.com`;
        const password = `TestPass123!`;
        const firstName = role === "admin" ? "テスト管理者" : "テストユーザー";

        console.log("[dev/create-test-user] ユーザー作成中:", { email, firstName });

        const user = await clerk.users.createUser({
            emailAddress: [email],
            password,
            firstName,
            lastName: "Dev",
            skipPasswordChecks: true,
        });

        console.log("[dev/create-test-user] ユーザー作成成功:", user.id);

        return NextResponse.json({
            email,
            password,
            clerkId: user.id,
            name: `${firstName} Dev`,
        });
    } catch (err: unknown) {
        console.error("[dev/create-test-user] エラー:", err);

        // Clerkのエラーは errors 配列を持つ
        const clerkErr = err as {
            errors?: { message: string; longMessage?: string; code?: string }[];
            message?: string;
        };
        const errorDetail = clerkErr.errors
            ? clerkErr.errors.map((e) => `${e.code}: ${e.longMessage || e.message}`).join(", ")
            : clerkErr.message || "不明なエラー";

        console.error("[dev/create-test-user] エラー詳細:", errorDetail);

        return NextResponse.json({ error: errorDetail }, { status: 500 });
    }
}
