import { NextResponse } from 'next/server';
import { simplifyContent } from '@/lib/vision';
import { getScreenshot } from '@/lib/agi';

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        // 1. Get screenshot from AGI.tech
        const base64Image = await getScreenshot(sessionId);

        // 2. Simplify with Gemini 3 Flash
        const simplifiedText = await simplifyContent(base64Image);

        return NextResponse.json({ simplifiedText });
    } catch (error: any) {
        console.error('Simplify API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
