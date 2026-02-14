import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Issue #55: Validate request body against a Zod schema.
 * Returns parsed data on success, or a 400 NextResponse on failure.
 */
export function validateBody<T>(
    schema: z.ZodSchema<T>,
    body: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
    const result = schema.safeParse(body);
    if (!result.success) {
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            ),
        };
    }
    return { success: true, data: result.data };
}
