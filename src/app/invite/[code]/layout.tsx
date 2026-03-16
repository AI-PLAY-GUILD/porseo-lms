import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "特別ご招待 | AI PLAY GUILD",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
