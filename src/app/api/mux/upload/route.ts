import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { convex } from '@/lib/convex';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // Security: Verify authentication and admin access
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // biome-ignore lint/suspicious/noExplicitAny: ConvexHttpClient requires string function reference
        const user = await convex.query("users:getUserByClerkIdServer" as any, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const uploadSettings = {
            new_asset_settings: {
                playback_policy: ["public"],
                generated_subtitles: [
                    {
                        language_code: "ja",
                        name: "Japanese",
                    },
                ],
                // biome-ignore lint/suspicious/noExplicitAny: Mux SDK AssetOptions type does not include generated_subtitles on new_asset_settings
            } as any,
            cors_origin: allowedOrigin,
        };

        const upload = await mux.video.uploads.create(uploadSettings);

        return NextResponse.json({
            id: upload.id,
            url: upload.url,
            uploadUrl: upload.url,
        });
    } catch (error) {
        console.error("Error creating upload URL:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function OPTIONS(req: NextRequest) {
    const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Upchunk-Method",
        },
    });
}

