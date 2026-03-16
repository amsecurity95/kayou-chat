# Kayou Chat

A minimal, sleek real-time chat application built with Next.js, Fastify, and PostgreSQL.

![Kayou Chat](https://via.placeholder.com/800x400/0A0A0B/E8E8E8?text=Kayou+Chat)

## Design Inspiration

- **Claude Code** — Dark, minimal, sharp typography
- **Telegram** — Familiar chat layout and UX  
- **Webflow/Figma** — Polished, professional craftsmanship

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend:** Fastify + Socket.io
- **Database:** PostgreSQL (Railway)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Railway or local)

### Installation

```bash
# Clone the repo
git clone https://github.com/amsecurity95/kayou-chat.git
cd kayou-chat

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run development
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgres://user:password@host:5432/kayouchat
PORT=3001
NODE_ENV=development
```

## Features

- ✅ Real-time messaging (WebSocket)
- ✅ Message persistence (PostgreSQL)
- ✅ User authentication
- ✅ Online status indicators
- ✅ Responsive design
- ✅ Dark mode UI

## Deployment

### Railway

1. Create a new Railway project
2. Add PostgreSQL plugin
3. Connect GitHub repository
4. Deploy automatically via GitHub Actions

## License

MIT
