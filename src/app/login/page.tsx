import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
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
        </div>
    );
}
