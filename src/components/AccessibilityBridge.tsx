'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AGISession {
    session_id: string;
    vnc_url?: string;
}

export default function AccessibilityBridge() {
    const [session, setSession] = useState<AGISession | null>(null);
    const [status, setStatus] = useState<'idle' | 'listening' | 'working' | 'error'>('idle');
    const [transcript, setTranscript] = useState('');
    const [commandInput, setCommandInput] = useState('');
    const [agentResponse, setAgentResponse] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [simplifiedContent, setSimplifiedContent] = useState('');
    const [preWarmedSession, setPreWarmedSession] = useState<AGISession | null>(null);
    const [isWarming, setIsWarming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const resultTranscript = event.results[current][0].transcript.toLowerCase();
                setTranscript(resultTranscript);

                if (event.results[current].isFinal) {
                    if (resultTranscript.includes('focus mode') || resultTranscript.includes('simplify')) {
                        toggleFocusMode();
                    } else if (resultTranscript.includes('describe') || resultTranscript.includes('vision')) {
                        describePage();
                    } else {
                        handleCommand(resultTranscript);
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setStatus('idle');
            };
        }
    }, []);

    // Session Warming: Initialize session in the background on mount
    useEffect(() => {
        const warmSession = async () => {
            setIsWarming(true);
            try {
                const res = await fetch('/api/agi/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentName: 'agi-0' }),
                });
                const data = await res.json();
                if (!data.error) {
                    setPreWarmedSession(data);
                }
            } catch (err) {
                console.error('Session warming failed:', err);
            } finally {
                setIsWarming(false);
            }
        };

        warmSession();
    }, []);

    const startSession = async () => {
        try {
            setError(null);

            // 1. Use pre-warmed session if available
            if (preWarmedSession) {
                setSession(preWarmedSession);
                setPreWarmedSession(null);
                setAgentResponse('Assistant Ready. Type or speak a command below.');
                return;
            }

            // 2. If already warming, wait or show status
            setStatus('working');
            if (isWarming) {
                setAgentResponse('Assistant is warming up... nearly there.');
                // In a real app we might poll, but for now we'll just start a 
                // fresh one if the user clicks now to ensure completion.
            } else {
                setAgentResponse('Initializing fresh session (30s cold start)...');
            }

            const res = await fetch('/api/agi/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentName: 'agi-0' }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSession(data);
            setStatus('idle');
            setAgentResponse('Assistant Ready. Type or speak a command below.');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    const handleCommand = async (command: string, isVisionTask: boolean = false) => {
        if (!session) {
            setError('Please start the session first.');
            return;
        }

        if (!command.trim()) return;

        try {
            setStatus('working');
            setAgentResponse(isVisionTask ? 'Analyzing visual layout...' : `Executing: "${command}"...`);
            setCommandInput('');

            const res = await fetch('/api/agi/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.session_id, message: command }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const responseText = data.message || 'Task completed.';
            setAgentResponse(responseText);
            speakResponse(responseText);
            setStatus('idle');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    const speakResponse = async (text: string) => {
        if (!text) return;

        try {
            // 1. Try High-Fidelity Gemini Voice
            const res = await fetch('/api/speech/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const data = await res.json();

            if (data.audio) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                await audio.play();
                return;
            }

            throw new Error('Gemini Voice failed, falling back...');
        } catch (err) {
            console.warn('Gemini Voice unavailable, falling back to system TTS:', err);

            // 2. Fallback: Browser Native TTS
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const startListening = () => {
        if (recognitionRef.current) {
            setStatus('listening');
            setTranscript('');
            recognitionRef.current.start();
        } else {
            setError('Speech recognition not supported.');
        }
    };

    const describePage = async () => {
        if (!session) {
            setError('Please start the session first.');
            return;
        }

        try {
            setStatus('working');
            setAgentResponse('Capturing screenshot and analyzing visual layout with Vision AI...');

            const res = await fetch('/api/vision/describe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.session_id }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const responseText = data.description || 'Could not generate visual description.';
            setAgentResponse(responseText);
            speakResponse(responseText);
            setStatus('idle');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    const toggleFocusMode = async () => {
        if (!session) {
            setError('Please start the session first.');
            return;
        }

        if (isFocusMode) {
            setIsFocusMode(false);
            setSimplifiedContent('');
            return;
        }

        try {
            setStatus('working');
            setAgentResponse('Simplifying page content for Focus Mode...');

            const res = await fetch('/api/vision/simplify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.session_id }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setSimplifiedContent(data.simplifiedText);
            setIsFocusMode(true);
            speakResponse("Focus Mode active. Here is a simplified summary of the page: " + data.simplifiedText);
            setStatus('idle');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="split-layout">
            {/* Control Panel (Left) */}
            <div className="control-panel">
                <header className="mb-8">
                    <h1 className="text-3xl font-black tracking-tighter">Access<span className="text-primary italic">AGI</span></h1>
                    <div className="mt-2 flex gap-4">
                        <div className="status-tag">
                            <span className={`w-2 h-2 rounded-full ${session ? 'bg-green-500' : 'bg-zinc-600'}`} />
                            {session ? 'Session Active' : 'Offline'}
                        </div>
                        {status !== 'idle' && (
                            <div className="status-tag">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                {status}
                            </div>
                        )}
                    </div>
                </header>

                {!session ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="glass-card">
                            <p className="text-zinc-400 mb-6">Initialize your universal computer-use agent to begin.</p>
                            <button onClick={startSession} className="high-contrast-btn w-full">
                                Power On Assistant
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col space-y-6">
                        <div className="glass-card flex-1 min-h-0 flex flex-col">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 ml-2">Agent Feed</label>
                            <div className="flex-1 bg-black/40 rounded-2xl p-6 overflow-y-auto border border-white/5 space-y-4">
                                <p className="text-zinc-300 text-lg leading-relaxed">
                                    {status === 'listening' ? <span className="text-primary italic">{transcript || 'Listening...'}</span> : agentResponse}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mt-auto">
                            <div className="relative">
                                <input
                                    className="input-accessible pr-16"
                                    placeholder="Type a command..."
                                    value={commandInput}
                                    onChange={(e) => setCommandInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(commandInput)}
                                    disabled={status !== 'idle'}
                                />
                                <button
                                    onClick={() => handleCommand(commandInput)}
                                    className="absolute right-3 top-3 bottom-3 px-4 bg-primary text-black rounded-xl font-bold text-sm tracking-tighter"
                                    disabled={status !== 'idle' || !commandInput.trim()}
                                >
                                    SEND
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={startListening}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all border border-white/5"
                                    disabled={status !== 'idle'}
                                >
                                    🎙️ VOICE
                                </button>
                                <button
                                    onClick={describePage}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all border border-white/5"
                                    disabled={status !== 'idle'}
                                >
                                    🔍 DESC
                                </button>
                                <button
                                    onClick={toggleFocusMode}
                                    className={`font-black py-4 rounded-2xl transition-all border border-white/5 ${isFocusMode ? 'bg-primary text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                                    disabled={status !== 'idle'}
                                >
                                    ⚡ FOCUS
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-900/40 border border-red-500/50 rounded-2xl text-red-200 text-xs">
                        {error}
                    </div>
                )}
            </div>

            {/* Viewport Panel (Right) */}
            <div className="viewport-panel">
                {!session ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-primary rounded-full animate-spin mx-auto opacity-20" />
                        <p className="text-zinc-600 font-bold tracking-widest uppercase text-xs">Waiting for session initialization</p>
                    </div>
                ) : (
                    <div className="viewport-container">
                        <div className="absolute top-4 left-4 z-10">
                            <div className="status-tag bg-black/80 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live View Enabled
                            </div>
                        </div>

                        {session.vnc_url ? (
                            <div className="relative w-full h-full">
                                <iframe
                                    src={session.vnc_url}
                                    className="w-full h-full border-none"
                                    title="Agent Viewport"
                                />
                                {isFocusMode && (
                                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-20 p-12 overflow-y-auto animate-in fade-in duration-500">
                                        <div className="max-w-3xl mx-auto space-y-8">
                                            <header className="flex justify-between items-center border-b border-white/10 pb-6">
                                                <div>
                                                    <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-1">Focus Mode Active</h2>
                                                    <p className="text-white text-3xl font-bold">Simplified Content</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsFocusMode(false)}
                                                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </header>
                                            <div className="prose prose-invert prose-lg max-w-none">
                                                <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap text-xl">
                                                    {simplifiedContent}
                                                </div>
                                            </div>
                                            <footer className="pt-12 border-t border-white/10 text-center">
                                                <p className="text-zinc-500 text-sm">Distilled by AccessAGI Cognitive Engine</p>
                                            </footer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-6 text-zinc-500">
                                <svg className="w-24 h-24 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h2v3h-2v-3zm0-3h2v2h-2V9z" />
                                </svg>
                                <p className="font-medium">Connecting to secure viewport...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
