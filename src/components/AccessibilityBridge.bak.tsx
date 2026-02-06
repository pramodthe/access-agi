'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AGISession {
    id: string;
    vnc_url?: string;
}

export default function AccessibilityBridge() {
    const [session, setSession] = useState<AGISession | null>(null);
    const [status, setStatus] = useState<'idle' | 'listening' | 'working' | 'error'>('idle');
    const [transcript, setTranscript] = useState('');
    const [commandInput, setCommandInput] = useState('');
    const [agentResponse, setAgentResponse] = useState('');
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
                const resultTranscript = event.results[current][0].transcript;
                setTranscript(resultTranscript);

                if (event.results[current].isFinal) {
                    handleCommand(resultTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setStatus('idle');
            };
        }
    }, []);

    const startSession = async () => {
        try {
            setStatus('working');
            setError(null);
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

    const handleCommand = async (command: string) => {
        if (!session) {
            setError('Please start the session first.');
            return;
        }

        if (!command.trim()) return;

        try {
            setStatus('working');
            setAgentResponse(`Executing: "${command}"...`);
            setCommandInput('');

            const res = await fetch('/api/agi/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.id, message: command }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setAgentResponse(data.message || 'Task completed.');
            setStatus('idle');
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
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

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={startListening}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all border border-white/5"
                                    disabled={status !== 'idle'}
                                >
                                    🎙️ VOICE
                                </button>
                                <button
                                    onClick={() => handleCommand("Describe the current page layout and all interactive elements.")}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all border border-white/5"
                                    disabled={status !== 'idle'}
                                >
                                    🔍 DESCRIBE
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
                            <iframe
                                src={session.vnc_url}
                                className="w-full h-full border-none"
                                title="Agent Viewport"
                            />
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
