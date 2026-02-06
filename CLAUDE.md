# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AccessAGI is an accessibility-focused AI agent interface that provides a universal computer-use interface. Users can initialize AGI sessions with voice/text commands, view a live VNC viewport of agent actions, and use speech-to-text for voice commands.

**Tech Stack:** Next.js 16.1.6 (App Router), TypeScript 5, React 19.2.3, Tailwind CSS 4

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

```
src/app/page.tsx
    └── AccessibilityBridge.tsx (main client component)
            ├── Uses Web Speech API for voice recognition
            ├── State machine: idle → listening → working → idle/error
            └── Sends commands via /api/agi/message

src/app/api/agi/
    ├── session/route.ts  (POST /api/agi/session)
    └── message/route.ts  (POST /api/agi/message)

src/lib/agi.ts  # AGI API client functions

Environment: AGI_API_KEY, AGI_API_URL (https://api.agi.tech)
```

## Environment Variables

Required in `.env.local`:
- `AGI_API_KEY` - Authentication for external AGI API
- `AGI_API_URL` - External AGI service endpoint (default: https://api.agi.tech)
