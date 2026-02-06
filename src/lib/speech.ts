
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

export async function generateSpeech(text: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is not configured.');
    }

    // Using the Flash Latest model which is stable in v1beta
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `Read this text aloud in a natural human voice: ${text}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                response_modalities: ["AUDIO"],
            }
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini Voice API Error: ${error}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const audioPart = data.candidates[0].content.parts.find((p: any) => p.inline_data);
        if (audioPart && audioPart.inline_data) {
            return audioPart.inline_data.data; // Base64 WAV data
        }
    }

    throw new Error('Gemini Voice API returned an unexpected response format.');
}
