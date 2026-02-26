import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 開発環境専用 - テストユーザーを自動作成
export async function POST(req: Request) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    try {
        const { role } = (await req.json()) as { role?: "user" | "admin" };
        const clerk = await clerkClient();

        const timestamp = Date.now();
        const email = `test-${role || "user"}-${timestamp}@dev.local`;
        const password = `DevTest_${timestamp}!`;
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
        const error = err as { errors?: { message: string }[]; message?: string };
        console.error("Failed to create test user:", error);
        return NextResponse.json(
            { error: error.errors?.[0]?.message || error.message || "ユーザー作成に失敗しました" },
            { status: 500 },
        );
    }
}
