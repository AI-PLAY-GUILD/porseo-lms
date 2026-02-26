import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-sm border border-slate-100 rounded-2xl",
                    },
                }}
                redirectUrl="/dashboard"
                signUpUrl="/join"
            />
            {process.env.NODE_ENV === "development" && (
                <Link href="/dev-login" className="mt-4 text-sm text-amber-600 hover:text-amber-800 transition-colors">
                    開発用ログイン →
                </Link>
            )}
        </div>
    );
}
