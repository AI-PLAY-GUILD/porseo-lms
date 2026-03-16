import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "noteプロモーション管理 | AI PLAY GUILD",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
