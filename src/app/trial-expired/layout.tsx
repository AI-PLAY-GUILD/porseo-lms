import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "無料体験期間終了 | AI PLAY GUILD",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
