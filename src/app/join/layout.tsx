import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "参加する | AI PLAY GUILD",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
