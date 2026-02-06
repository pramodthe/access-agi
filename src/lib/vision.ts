
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

export async function describeImage(base64Image: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env.local');
    }

    // Clean the base64 string: Remove Data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Using the new Gemini 3 Flash Preview model for fast, state-of-the-art vision
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

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
                            text: `You are an expert accessibility assistant. Analyze this screenshot of a web browser and provide a detailed description for a blind or visually impaired user.
              1. Summarize the overall purpose of the page.
              2. Describe the main layout (header, sidebar, main content).
              3. Identify all interactive elements (buttons, links, inputs) and their purposes.
              4. Specifically point out any visual information (charts, images) that might be inaccessible.
              Keep the description structured and easy to read. Provide a concise but comprehensive summary.`,
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: cleanBase64,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.1,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini 3 Flash API Error: ${error}\nStatus: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Gemini 3 Flash API returned an unexpected response format.');
}

export async function simplifyContent(base64Image: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env.local');
    }

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

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
                            text: `You are an expert cognitive accessibility assistant. 
              Analyze this screenshot of a web page and perform "Text Distillation":
              1. Extract the primary information and core meaning of the page.
              2. Ignore all extraneous content (ads, navigation menus, footers, sidebars).
              3. Reformat the essential content into highly simplified, bulleted points.
              4. Use clear, plain language (easier-to-read style).
              5. If there are complex terms, explain them simply in brackets.
              Provide only the simplified bulleted summary.`,
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: cleanBase64,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.2,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini 3 Flash API Error: ${error}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Gemini 3 Flash API returned an unexpected response format.');
}
