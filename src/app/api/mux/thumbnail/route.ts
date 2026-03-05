import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: getConvexInternalSecret(),
        });
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { title, summary, style } = body as {
            title: string;
            summary?: string;
            style?: string;
        };

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const styleMap: Record<string, string> = {
            modern: "modern, clean, vibrant gradient background, bold typography",
            tech: "dark tech-inspired, neon accents, circuit board patterns, futuristic",
            minimal: "minimalist, white space, simple geometric shapes, elegant typography",
        };

        const styleDesc = styleMap[style || "modern"] || styleMap.modern;

        const prompt = `Create a professional YouTube-style thumbnail image for a video titled: "${title}". ${summary ? "The video is about: " + summary + ". " : ""}Style: ${styleDesc}, eye-catching, with bold text overlay showing the title in Japanese. 16:9 aspect ratio. The text should be large and readable. Do NOT include any watermarks.`;

        const client = new GoogleGenAI({ apiKey });

        const response = await client.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: prompt,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
            },
        });

        // Extract image from response
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData?.data) {
                        return NextResponse.json({
                            imageBase64: part.inlineData.data,
                            mimeType: part.inlineData.mimeType || "image/png",
                        });
                    }
                }
            }
        }

        return NextResponse.json({ error: "画像の生成に失敗しました" }, { status: 500 });
    } catch (error) {
        console.error("[mux/thumbnail] エラー:", error);
        return NextResponse.json(
            { error: `サムネイル生成エラー: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 },
        );
    }
}
