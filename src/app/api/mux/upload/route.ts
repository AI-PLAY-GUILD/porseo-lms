import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: NextRequest) {
    console.log("POST /api/mux/upload called");
    try {
        // 本来はここで認証と管理者権限チェックが必要
        // 今回は簡易的に実装し、後ほど強化する

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
            cors_origin: "*", // 本番環境では適切なオリジンに制限すべき
        };

        console.log("Creating upload with settings:", JSON.stringify(uploadSettings, null, 2));

        const upload = await mux.video.uploads.create(uploadSettings);

        console.log("Upload URL created:", upload.url);

        return NextResponse.json({
            id: upload.id,
            url: upload.url,
            uploadUrl: upload.url, // MuxUploaderのバージョンによってはこれを期待する場合がある
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
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Upchunk-Method", // Upchunk headers
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
