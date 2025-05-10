# GridSync Example Backend

This is a lightweight SQLite database backend for the GridSync example application. It provides persistence for the real-time collaborative grid editing functionality.

## Features

- SQLite database for persistent storage
- REST API for data access
- Integration with the GridSync WebSocket service

## Setup

1. Install dependencies:

```bash
cd example-application/backend
npm install
```

2. Run the server:

```bash
npm run dev
```

The server will start on port 5000 by default.

## API Endpoints

- `GET /api/documents/:tenantId/:documentId` - Get document data with cells
- `POST /api/cells` - Update a cell

## Integration with GridSync

The backend integrates with the GridSync WebSocket service to provide:

1. Initial loading of data when a client first opens a document
2. Persistence of cell updates from Redis to the database

## Data Flow

1. First client opens a document:
   - GridSync checks Redis for document data
   - If Redis is empty, it loads data from this backend
   - All cells are buffered in Redis

2. Subsequent clients:
   - Load data directly from Redis

3. On cell updates:
   - Changes are immediately sent to Redis
   - Changes are broadcast to all connected clients via Redis Pub/Sub
   - Changes are also persisted to this SQLite database

## Database Schema

- `documents` - Document metadata
- `rows` - Row definitions and ordering
- `columns` - Column definitions and ordering
- `cells` - Cell data with values and metadata 