import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "動画管理 | AI PLAY GUILD",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
