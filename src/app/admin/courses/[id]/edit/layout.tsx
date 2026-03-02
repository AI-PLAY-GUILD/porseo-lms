import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "コース編集 | AI PLAY GUILD",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
