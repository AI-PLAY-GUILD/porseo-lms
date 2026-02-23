import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ダッシュボード | AI PLAY GUILD",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
