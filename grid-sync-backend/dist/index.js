"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = require("ws");
const redisService_1 = require("./services/redisService");
const webSocketController_1 = require("./controllers/webSocketController");
const authMiddleware_1 = require("./middleware/authMiddleware");
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
// Set up API keys from environment variables
if (process.env.API_KEY_1 && process.env.API_KEY_1_TENANT_ID) {
    console.log(`Using API key from environment for tenant ${process.env.API_KEY_1_TENANT_ID}`);
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Create HTTP server
const server = http_1.default.createServer(app);
// Create WebSocket server
const wss = new ws_1.WebSocketServer({ noServer: true });
// Initialize Redis connection with connection string from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
(0, redisService_1.setupRedisConnection)(REDIS_URL)
    .then(() => {
    console.log('Redis connection established');
})
    .catch((err) => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
});
// Set up WebSocket handlers
(0, webSocketController_1.setupWebSocketHandlers)(wss);
// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    // Extract API key from query parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const apiKey = url.searchParams.get('apiKey');
    // Authenticate API key
    (0, authMiddleware_1.validateApiKey)(apiKey || '', (err, tenant) => {
        if (err || !tenant) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        // Authentication successful - upgrade the connection
        wss.handleUpgrade(request, socket, head, (ws) => {
            // Attach tenant ID to the WebSocket connection
            ws.tenantId = tenant.id;
            wss.emit('connection', ws, request);
        });
    });
});
// REST API routes
app.get('/api/:tenantId/documents/:documentId/state', authMiddleware_1.apiKeyMiddleware, function (req, res) {
    // This will be implemented later
    res.status(501).json({ message: 'Not implemented yet' });
});
app.post('/api/:tenantId/documents/:documentId/persist', authMiddleware_1.apiKeyMiddleware, function (req, res) {
    // This will be implemented later
    res.status(501).json({ message: 'Not implemented yet' });
});
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
