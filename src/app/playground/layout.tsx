import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "プレイグラウンド | AI PLAY GUILD",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
