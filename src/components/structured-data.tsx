export function StructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "AI PLAY GUILD",
        description:
            "AI PLAY GUILDは、動画学習、Discord連携、AIによる学習サポートを提供するプロフェッショナル向け学習管理システムです。最先端の技術を駆使して、効率的な学習体験を提供します。",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app",
        logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app"}/logo.png`,
        sameAs: ["https://twitter.com/aiplayguild"],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@aiplayguild.com",
        },
        offers: {
            "@type": "Offer",
            category: "Educational Service",
            availability: "https://schema.org/InStock",
            priceCurrency: "JPY",
            name: "AI PLAY GUILDメンバーシップ",
        },
    };

    const websiteStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AI PLAY GUILD",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app",
        description: "プロフェッショナル向け学習管理システム",
        inLanguage: "ja-JP",
    };

    const courseStructuredData = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: "AI PLAY GUILDオンライン学習プログラム",
        description: "動画学習とDiscord連携による実践的なオンライン学習プログラム",
        provider: {
            "@type": "Organization",
            name: "AI PLAY GUILD",
            sameAs: process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app",
        },
        educationalLevel: "Professional",
        inLanguage: "ja-JP",
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(courseStructuredData) }}
            />
        </>
    );
}
