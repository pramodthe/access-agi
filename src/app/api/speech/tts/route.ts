import { NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/speech';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Generate high-fidelity audio with Gemini
        const audioBase64 = await generateSpeech(text);

        return NextResponse.json({ audio: audioBase64 });
    } catch (error: any) {
        console.error('Speech API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
