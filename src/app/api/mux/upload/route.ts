import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { convex } from '@/lib/convex';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: NextRequest) {
    console.log("POST /api/mux/upload called");
    try {
        // Security: Verify authentication and admin access
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await convex.query("users:getUserByClerkIdQuery" as any, { clerkId: userId });
        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL || "*";

        const uploadSettings = {
            new_asset_settings: {
                playback_policy: ["public"],
                generated_subtitles: [
                    {
                        language_code: "ja",
                        name: "Japanese",
                    },
                ],
            } as any,
            cors_origin: allowedOrigin,
        };

        console.log("Creating upload with settings:", JSON.stringify(uploadSettings, null, 2));

        const upload = await mux.video.uploads.create(uploadSettings);

        console.log("Upload URL created:", upload.url);

        return NextResponse.json({
            id: upload.id,
            url: upload.url,
            uploadUrl: upload.url,
        });
    } catch (error) {
        console.error("Error creating upload URL:", error);
        return NextResponse.json(
            { error: "Error creating upload URL", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function OPTIONS(req: NextRequest) {
    const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL || "*";
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Upchunk-Method",
        },
    });
}

export async function GET(req: NextRequest) {
    console.log("GET /api/mux/upload called");
    return NextResponse.json({ message: "Mux Upload API is working" });
}

export async function PUT(req: NextRequest) {
    console.log("PUT /api/mux/upload called");
    return NextResponse.json({ error: "PUT method not supported, use POST" }, { status: 405 });
}
