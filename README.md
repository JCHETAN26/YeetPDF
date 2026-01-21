# PDFtoLink - "Imgur for PDFs"

A high-speed, no-friction PDF sharing platform with page-level engagement analytics.

## Features

- **Instant Upload**: Drag & drop a PDF, get a shareable link in seconds
- **Watermark-Free Viewing**: Clean PDF viewing experience
- **Page Heatmaps**: See which pages get the most attention
- **Auto-Expiry**: Links auto-delete after 7 days to minimize storage costs
- **Ad-Ready**: Designated ad spaces for Google AdSense monetization

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │
│  (React/Vite)   │     │   (Express)     │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   Browser PDF.js          In-Memory Store
   Rendering               (or Redis/S3)
```

## Backend Responsibilities (5 Core Functions)

1. **Issue Secure Upload URLs** - `POST /api/upload/request`
2. **Serve PDFs Efficiently** - `GET /api/pdf/:id` (with range request support)
3. **Collect Page-Level Events** - `POST /api/analytics/event`
4. **Aggregate Heatmap Data** - `GET /api/analytics/:id/heatmap`
5. **Auto-Expire Documents** - Cron job (hourly cleanup)

## Quick Start

```bash
# Install dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## API Endpoints

### Upload
- `POST /api/upload/direct` - Direct file upload (multipart/form-data)
- `POST /api/upload/request` - Request presigned upload URL

### PDF Serving
- `GET /api/pdf/:id` - Serve PDF file (supports range requests)
- `GET /api/pdf/:id/info` - Get document metadata
- `HEAD /api/pdf/:id` - Check if document exists

### Analytics
- `POST /api/analytics/event` - Track page view/exit event
- `POST /api/analytics/batch` - Track multiple events
- `GET /api/analytics/:id/heatmap` - Get page engagement heatmap
- `GET /api/analytics/:id/summary` - Get quick stats

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_USE_BACKEND=true
```

### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:5173
DOCUMENT_EXPIRY_DAYS=7
```

## Revenue Model

- **Ad Placements**: 
  - Upload success page (728x90 leaderboard)
  - PDF viewer sidebar (300x250 rectangle)
  - Analytics dashboard (728x90 leaderboard)
- **Premium Features** (future):
  - Extended expiry (30 days, permanent)
  - Custom branding
  - Download analytics CSV

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, In-Memory Store
- **PDF Rendering**: PDF.js (client-side)
- **Scheduling**: node-cron

## License

MIT
