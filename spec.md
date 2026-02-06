# Technical Specification: AccessAGI Platform

## 1. Project Vision
AccessAGI is a client-side AI accessibility bridge designed to empower users with disabilities (motor, visual, and cognitive impairments) to navigate and interact with the modern web. Instead of fixing inaccessible source code, AccessAGI uses a hybrid agent architecture to interpret and control interfaces on behalf of the user.

## 2. Hybrid Agent Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Action Agent** | [AGI.tech](https://agi.tech) (AGI-0) | The "Hands" — handles browser navigation, form filling, and DOM interaction. |
| **Vision Agent** | Google Gemini 2.0 Flash | The "Eyes" — performs high-resolution spatial analysis of the viewport for accessibility descriptions. |
| **Interface** | Next.js 16 + Tailwind | The "Bridge" — provides a high-contrast, split-screen portal with voice and text support. |
| **Communication** | Web Speech API | The "Voice" — handles STT (Speech-to-Text) and TTS (Text-to-Speech). |

## 3. System Components

### 3.1. High-Contrast UI (Completed)
- **Split-Screen Layout**: Fixed control panel on the left, live agent viewport on the right.
- **Visual Feedback**: Live status tags for Session connectivity and Agent status.
- **Input Channels**: Unified input supporting both mechanical typing and voice commands.

### 3.2. Visual Bridge (Completed)
- **Real-time Screenshots**: `GET /v1/sessions/{id}/screenshot` from AGI.tech.
- **AI Description**: `gemini-2.0-flash-exp` analyzes the screenshot and provides a structured summary.
- **Audio Output**: Voice synthesis (TTS) reads the analysis aloud automatically.

### 3.3. Command & Control (Completed)
- **Natural Language Parsing**: Commands like "Go to Google" or "Buy this product" are routed to AGI-0.
- **VNC Integration**: Live monitoring of agent movements through a secure VNC iframe.

## 4. Completed Phases

### Phase 3: Cognitive Simplification (Completed)
- **Text Distillation**: Gemini 3 Flash extracts core meaning and simplifies page content.
- **Focus Mode**: A high-contrast UI overlay that hides non-essential page elements.

### Phase 4: UX & Human-Like Voice (Completed)
- **High-Fidelity TTS**: Integrated Gemini 2.0 Flash audio generation for human-like feedback.
- **Resilient Fallback**: Automated switch to system TTS if AI voice fails.

## 5. Pending Completion (Roadmap)

### Phase 5: Autonomous Workflows & Performance
- **Session Warming**: Pre-initializing AGI sessions on app load to eliminate the 30s "cold start" latency.
- **Cross-Site Tasks**: Support for multi-step autonomous workflows (e.g., "Find the cheapest price for X across 3 stores").
- **Streaming Responses**: Real-time feedback as the agent "thinks" and navigates.
- **Scaffolded Sessions**: All browser activities are isolated to the AGI.tech server-side environment.
- **PII Protection**: Integration of a filtering layer to ensure sensitive user data isn't unnecessarily passed to the Vision AI.
