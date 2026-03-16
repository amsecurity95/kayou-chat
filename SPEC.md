# Kayou Chat - Specification

## Overview
A sleek, minimal real-time chat application. Built from scratch with Next.js, Fastify, and PostgreSQL.

## Design Inspiration
- **Claude Code** — Dark, minimal, sharp typography
- **Telegram** — Familiar chat layout and UX
- **Webflow/Figma** — Polished, professional, craftsmanship

## Tech Stack
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Fastify + Socket.io
- Database: PostgreSQL (Railway)
- Icons: Lucide React

## UI/UX Spec

### Color Palette
- Background: `#0A0A0B` (deep black)
- Surface: `#141416` (card/panel)
- Surface Hover: `#1C1C1F`
- Border: `#2A2A2E`
- Primary Accent: `#E8E8E8` (near white for text)
- Secondary: `#71717A` (muted text)
- Accent: `#FFFFFF` (pure white for emphasis)
- Incoming Message BG: `#1C1C1F`
- Outgoing Message BG: `#2A2A2E`

### Typography
- Font Family: `"JetBrains Mono", monospace` for code-feel, `"Inter"` for UI
- Headings: 600 weight
- Body: 400 weight
- Sizes: xs=12px, sm=14px, base=15px, lg=18px

### Layout
- Sidebar: 280px fixed (dark surface)
- Chat Area: flex-1
- Message bubbles: rounded-2xl, max-width 70%
- Spacing: 16px base unit
- Border radius: 12px for cards, 20px for messages

### Components
1. **Sidebar**
   - Logo/brand at top
   - User list or conversation list
   - New chat button
   - Minimal, no clutter

2. **Chat Header**
   - Recipient name
   - Status indicator (online/offline)
   - Minimal actions

3. **Message Area**
   - Auto-scroll to bottom
   - Timestamps on hover
   - Different bg for sent vs received
   - Smooth fade-in animation

4. **Input Area**
   - Clean input field
   - Send button with icon
   - Subtle border, no heavy shadows

### Animations
- Messages: fade-in + slide-up (150ms)
- Hover states: 100ms ease
- Sidebar: subtle transitions

## Features
1. Real-time messaging (WebSocket)
2. Message persistence (PostgreSQL)
3. User auth (simple PIN or password)
4. Online status indicators
5. Responsive (mobile-friendly)

## Database Schema

### users
- id (UUID, PK)
- username (VARCHAR)
- created_at (TIMESTAMP)

### messages
- id (UUID, PK)
- sender_id (UUID, FK)
- receiver_id (UUID, FK)
- content (TEXT)
- created_at (TIMESTAMP)

## API Endpoints
- POST /api/auth
- GET /api/messages/:userId
- POST /api/messages
- WS /ws - real-time events
