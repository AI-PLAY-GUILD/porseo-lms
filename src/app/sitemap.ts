import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app";

    // 静的ページ
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/videos`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/profile`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/join`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];

    // 注意: 動的な動画ページなどは、実際のデータベースから取得する必要があります
    // 現在は静的ページのみを返します
    // 将来的には、Convexから動画一覧を取得して動的に生成することを推奨します

    return staticPages;
}
