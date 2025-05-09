# GridSync Server

This is the backend server for GridSync, a multi-tenant, real-time collaboration service for data grids.

## Features

- **Multi-Tenant Isolation:** Each tenant has segregated real-time state and persistence.
- **Real-Time Collaboration:** Synchronize grid edits in real time between multiple users.
- **Persistence:** Store document state in Redis with optional persistence to origin databases.
- **WebSocket API:** Real-time communication with connected clients.

## Requirements

- Node.js 16+
- Redis server (for data storage and pub/sub)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with the following settings:

```
PORT=3000
REDIS_URL=redis://localhost:6379
API_KEY_1=test-api-key-1
API_KEY_1_TENANT=tenant1
API_KEY_2=test-api-key-2
API_KEY_2_TENANT=tenant2
```

## Development

```bash
# Build the project
npm run build

# Start development server with auto-reload
npm run dev

# Start development server with debugging
npm run dev:debug

# Start production server
npm start
```

## API

The server exposes the following endpoints:

- `GET /health` - Health check endpoint
- `WS /realtime` - WebSocket endpoint for real-time communication

## License

MIT 