"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedisConnections = exports.getDocumentState = exports.initializeEmptyCellsForRow = exports.getColumnOrder = exports.getRowOrder = exports.getCellData = exports.setCellData = exports.publishToDocumentChannel = exports.unsubscribeFromDocumentChannel = exports.subscribeToDocumentChannel = exports.getRedisSubClient = exports.getRedisPubClient = exports.getRedisClient = exports.setupRedisConnection = void 0;
const redis_1 = require("redis");
// Redis clients
let redisClient;
let redisPubClient;
let redisSubClient;
/**
 * Setup Redis connection for main client and pub/sub clients
 * @param redisUrl The Redis connection URL
 */
const setupRedisConnection = async (redisUrl = 'redis://localhost:6379') => {
    // Create Redis client
    redisClient = (0, redis_1.createClient)({
        url: redisUrl,
    });
    // Create separate clients for pub/sub (recommended by Redis)
    redisPubClient = redisClient.duplicate();
    redisSubClient = redisClient.duplicate();
    // Connect all clients
    await redisClient.connect();
    await redisPubClient.connect();
    await redisSubClient.connect();
    // Handle errors
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisPubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    redisSubClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    return { redisClient, redisPubClient, redisSubClient };
};
exports.setupRedisConnection = setupRedisConnection;
/**
 * Get the Redis client instance
 */
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
/**
 * Get the Redis pub client instance
 */
const getRedisPubClient = () => {
    if (!redisPubClient) {
        throw new Error('Redis pub client not initialized');
    }
    return redisPubClient;
};
exports.getRedisPubClient = getRedisPubClient;
/**
 * Get the Redis sub client instance
 */
const getRedisSubClient = () => {
    if (!redisSubClient) {
        throw new Error('Redis sub client not initialized');
    }
    return redisSubClient;
};
exports.getRedisSubClient = getRedisSubClient;
/**
 * Subscribe to a tenant's document channel
 */
const subscribeToDocumentChannel = async (tenantId, documentId, callback) => {
    const channel = `tenant:${tenantId}:doc:${documentId}`;
    await redisSubClient.subscribe(channel, callback);
};
exports.subscribeToDocumentChannel = subscribeToDocumentChannel;
/**
 * Unsubscribe from a tenant's document channel
 */
const unsubscribeFromDocumentChannel = async (tenantId, documentId) => {
    const channel = `tenant:${tenantId}:doc:${documentId}`;
    await redisSubClient.unsubscribe(channel);
};
exports.unsubscribeFromDocumentChannel = unsubscribeFromDocumentChannel;
/**
 * Publish a message to a tenant's document channel
 */
const publishToDocumentChannel = async (tenantId, documentId, message) => {
    const channel = `tenant:${tenantId}:doc:${documentId}`;
    await redisPubClient.publish(channel, JSON.stringify(message));
};
exports.publishToDocumentChannel = publishToDocumentChannel;
/**
 * Store cell data in Redis
 */
const setCellData = async (tenantId, documentId, rowId, columnId, cellData) => {
    const key = `tenant:${tenantId}:doc:${documentId}:row:${rowId}:col:${columnId}`;
    await redisClient.set(key, JSON.stringify(cellData));
};
exports.setCellData = setCellData;
/**
 * Get cell data from Redis
 */
const getCellData = async (tenantId, documentId, rowId, columnId) => {
    const key = `tenant:${tenantId}:doc:${documentId}:row:${rowId}:col:${columnId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};
exports.getCellData = getCellData;
/**
 * Get the order of rows for a document
 */
const getRowOrder = async (tenantId, documentId) => {
    const listKey = `tenant:${tenantId}:doc:${documentId}:rows`;
    return redisClient.lRange(listKey, 0, -1);
};
exports.getRowOrder = getRowOrder;
/**
 * Get the order of columns for a document
 */
const getColumnOrder = async (tenantId, documentId) => {
    const listKey = `tenant:${tenantId}:doc:${documentId}:columns`;
    return redisClient.lRange(listKey, 0, -1);
};
exports.getColumnOrder = getColumnOrder;
/**
 * Initialize empty cells for a new row
 */
const initializeEmptyCellsForRow = async (tenantId, documentId, rowId, timestamp) => {
    // Get all columns
    const columns = await (0, exports.getColumnOrder)(tenantId, documentId);
    // Create empty cells for each column
    const initPromises = columns.map(columnId => {
        const emptyCellData = {
            value: null,
            timestamp
        };
        return (0, exports.setCellData)(tenantId, documentId, rowId, columnId, emptyCellData);
    });
    await Promise.all(initPromises);
};
exports.initializeEmptyCellsForRow = initializeEmptyCellsForRow;
/**
 * Get the entire state of a document
 */
const getDocumentState = async (tenantId, documentId) => {
    // Get row and column order
    const rows = await (0, exports.getRowOrder)(tenantId, documentId);
    const columns = await (0, exports.getColumnOrder)(tenantId, documentId);
    // Build cell map
    const cells = {};
    // Fetch all cells
    for (const rowId of rows) {
        cells[rowId] = {};
        for (const columnId of columns) {
            const cellData = await (0, exports.getCellData)(tenantId, documentId, rowId, columnId);
            if (cellData) {
                cells[rowId][columnId] = cellData;
            }
        }
    }
    return {
        rows,
        columns,
        cells
    };
};
exports.getDocumentState = getDocumentState;
/**
 * Close Redis connections
 */
const closeRedisConnections = async () => {
    await redisClient.quit();
    await redisPubClient.quit();
    await redisSubClient.quit();
};
exports.closeRedisConnections = closeRedisConnections;
