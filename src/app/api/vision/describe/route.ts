import { NextResponse } from 'next/server';
import { describeImage } from '@/lib/vision';
import { getScreenshot } from '@/lib/agi';

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        // 1. Get screenshot from AGI.tech
        const base64Image = await getScreenshot(sessionId);

        // 2. Analyze with GPT-4o Vision
        const description = await describeImage(base64Image);

        return NextResponse.json({ description });
    } catch (error: any) {
        console.error('Vision API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
