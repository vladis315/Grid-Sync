import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { setupRedisConnection } from './services/redisService';
import { setupWebSocketHandlers } from './controllers/webSocketController';
import { apiKeyMiddleware, validateApiKey } from './middleware/authMiddleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Set up API keys from environment variables
if (process.env.API_KEY_1 && process.env.API_KEY_1_TENANT_ID) {
  console.log(`Using API key from environment for tenant ${process.env.API_KEY_1_TENANT_ID}`);
}

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Initialize Redis connection with connection string from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
setupRedisConnection(REDIS_URL)
  .then(() => {
    console.log('Redis connection established');
  })
  .catch((err) => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  });

// Set up WebSocket handlers
setupWebSocketHandlers(wss);

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  // Extract API key from query parameters
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const apiKey = url.searchParams.get('apiKey');
  
  // Authenticate API key
  validateApiKey(apiKey || '', (err, tenant) => {
    if (err || !tenant) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Authentication successful - upgrade the connection
    wss.handleUpgrade(request, socket, head, (ws) => {
      // Attach tenant ID to the WebSocket connection
      (ws as any).tenantId = tenant.id;
      wss.emit('connection', ws, request);
    });
  });
});

// REST API routes
app.get(
  '/api/:tenantId/documents/:documentId/state', 
  apiKeyMiddleware, 
  function(req: express.Request, res: express.Response): void {
    // This will be implemented later
    res.status(501).json({ message: 'Not implemented yet' });
  }
);

app.post(
  '/api/:tenantId/documents/:documentId/persist', 
  apiKeyMiddleware, 
  function(req: express.Request, res: express.Response): void {
    // This will be implemented later
    res.status(501).json({ message: 'Not implemented yet' });
  }
);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  // Close Redis connections and cleanup
  // This will be implemented in the Redis service
  process.exit(0);
}); 