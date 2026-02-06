import { NextResponse } from 'next/server';
import { createSession } from '@/lib/agi';

export async function POST(request: Request) {
    try {
        const { agentName } = await request.json();
        const session = await createSession(agentName);
        return NextResponse.json(session);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
