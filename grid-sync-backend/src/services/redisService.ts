import { createClient, RedisClientType } from 'redis';

// Redis clients
let redisClient: RedisClientType;
let redisPubClient: RedisClientType;
let redisSubClient: RedisClientType;

/**
 * Setup Redis connection for main client and pub/sub clients
 * @param redisUrl The Redis connection URL
 */
export const setupRedisConnection = async (redisUrl: string = 'redis://localhost:6379') => {
  // Create Redis client
  redisClient = createClient({
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

/**
 * Get the Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

/**
 * Get the Redis pub client instance
 */
export const getRedisPubClient = () => {
  if (!redisPubClient) {
    throw new Error('Redis pub client not initialized');
  }
  return redisPubClient;
};

/**
 * Get the Redis sub client instance
 */
export const getRedisSubClient = () => {
  if (!redisSubClient) {
    throw new Error('Redis sub client not initialized');
  }
  return redisSubClient;
};

/**
 * Subscribe to a tenant's document channel
 */
export const subscribeToDocumentChannel = async (
  tenantId: string, 
  documentId: string, 
  callback: (message: string) => void
) => {
  const channel = `tenant:${tenantId}:doc:${documentId}`;
  await redisSubClient.subscribe(channel, callback);
};

/**
 * Unsubscribe from a tenant's document channel
 */
export const unsubscribeFromDocumentChannel = async (
  tenantId: string, 
  documentId: string
) => {
  const channel = `tenant:${tenantId}:doc:${documentId}`;
  await redisSubClient.unsubscribe(channel);
};

/**
 * Publish a message to a tenant's document channel
 */
export const publishToDocumentChannel = async (
  tenantId: string, 
  documentId: string, 
  message: any
) => {
  const channel = `tenant:${tenantId}:doc:${documentId}`;
  await redisPubClient.publish(channel, JSON.stringify(message));
};

/**
 * Store cell data in Redis
 */
export const setCellData = async (
  tenantId: string,
  documentId: string,
  rowId: string,
  columnId: string,
  cellData: any
) => {
  const key = `tenant:${tenantId}:doc:${documentId}:row:${rowId}:col:${columnId}`;
  await redisClient.set(key, JSON.stringify(cellData));
};

/**
 * Get cell data from Redis
 */
export const getCellData = async (
  tenantId: string,
  documentId: string,
  rowId: string,
  columnId: string
) => {
  const key = `tenant:${tenantId}:doc:${documentId}:row:${rowId}:col:${columnId}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Get the order of rows for a document
 */
export const getRowOrder = async (
  tenantId: string,
  documentId: string
) => {
  const listKey = `tenant:${tenantId}:doc:${documentId}:rows`;
  return redisClient.lRange(listKey, 0, -1);
};

/**
 * Get the order of columns for a document
 */
export const getColumnOrder = async (
  tenantId: string,
  documentId: string
) => {
  const listKey = `tenant:${tenantId}:doc:${documentId}:columns`;
  return redisClient.lRange(listKey, 0, -1);
};

/**
 * Initialize empty cells for a new row
 */
export const initializeEmptyCellsForRow = async (
  tenantId: string,
  documentId: string,
  rowId: string,
  timestamp: number
) => {
  // Get all columns
  const columns = await getColumnOrder(tenantId, documentId);
  
  // Create empty cells for each column
  const initPromises = columns.map(columnId => {
    const emptyCellData = {
      value: null,
      timestamp
    };
    return setCellData(tenantId, documentId, rowId, columnId, emptyCellData);
  });
  
  await Promise.all(initPromises);
};

/**
 * Get the entire state of a document
 */
export const getDocumentState = async (
  tenantId: string,
  documentId: string
) => {
  // Get row and column order
  const rows = await getRowOrder(tenantId, documentId);
  const columns = await getColumnOrder(tenantId, documentId);
  
  // Build cell map
  const cells: Record<string, Record<string, any>> = {};
  
  // Fetch all cells
  for (const rowId of rows) {
    cells[rowId] = {};
    
    for (const columnId of columns) {
      const cellData = await getCellData(tenantId, documentId, rowId, columnId);
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

/**
 * Close Redis connections
 */
export const closeRedisConnections = async () => {
  await redisClient.quit();
  await redisPubClient.quit();
  await redisSubClient.quit();
}; 