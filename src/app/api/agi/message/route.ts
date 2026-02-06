import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/agi';

export async function POST(request: Request) {
    try {
        const { sessionId, message } = await request.json();
        const result = await sendMessage(sessionId, message);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
