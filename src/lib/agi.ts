
export interface AGISession {
    session_id: string;
    status: string;
    agent_name: string;
    webhook_url?: string;
    vnc_url?: string;
}

export interface AGIMessageResponse {
    message: string;
    status: string;
}

const AGI_API_URL = process.env.AGI_API_URL || 'https://api.agi.tech';
const AGI_API_KEY = process.env.AGI_API_KEY;

export async function createSession(agentName: string = 'agi-0'): Promise<AGISession> {
    const response = await fetch(`${AGI_API_URL}/v1/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AGI_API_KEY}`,
        },
        body: JSON.stringify({ agent_name: agentName }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create AGI session: ${error}`);
    }

    return response.json();
}

export async function sendMessage(sessionId: string, message: string): Promise<AGIMessageResponse> {
    const response = await fetch(`${AGI_API_URL}/v1/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AGI_API_KEY}`,
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send message to AGI: ${error}`);
    }

    return response.json();
}

export async function getScreenshot(sessionId: string): Promise<string> {
    const response = await fetch(`${AGI_API_URL}/v1/sessions/${sessionId}/screenshot`, {
        headers: {
            'Authorization': `Bearer ${AGI_API_KEY}`,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get screenshot: ${error}`);
    }

    const data = await response.json();
    return data.screenshot; // Assuming base64
}
