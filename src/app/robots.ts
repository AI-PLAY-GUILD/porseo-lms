import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://porseo-lms.vercel.app";

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/videos", "/join", "/login"],
                disallow: [
                    "/admin/*",
                    "/dashboard/*",
                    "/profile/*",
                    "/api/*",
                    "/success/*",
                    "/playground/*",
                    "/ai-agent/*",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: ["/", "/videos", "/join", "/login"],
                disallow: ["/admin/*", "/dashboard/*", "/profile/*", "/api/*"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
