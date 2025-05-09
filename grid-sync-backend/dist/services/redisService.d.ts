import { RedisClientType } from 'redis';
/**
 * Setup Redis connection for main client and pub/sub clients
 * @param redisUrl The Redis connection URL
 */
export declare const setupRedisConnection: (redisUrl?: string) => Promise<{
    redisClient: RedisClientType;
    redisPubClient: RedisClientType;
    redisSubClient: RedisClientType;
}>;
/**
 * Get the Redis client instance
 */
export declare const getRedisClient: () => RedisClientType;
/**
 * Get the Redis pub client instance
 */
export declare const getRedisPubClient: () => RedisClientType;
/**
 * Get the Redis sub client instance
 */
export declare const getRedisSubClient: () => RedisClientType;
/**
 * Subscribe to a tenant's document channel
 */
export declare const subscribeToDocumentChannel: (tenantId: string, documentId: string, callback: (message: string) => void) => Promise<void>;
/**
 * Unsubscribe from a tenant's document channel
 */
export declare const unsubscribeFromDocumentChannel: (tenantId: string, documentId: string) => Promise<void>;
/**
 * Publish a message to a tenant's document channel
 */
export declare const publishToDocumentChannel: (tenantId: string, documentId: string, message: any) => Promise<void>;
/**
 * Store cell data in Redis
 */
export declare const setCellData: (tenantId: string, documentId: string, rowId: string, columnId: string, cellData: any) => Promise<void>;
/**
 * Get cell data from Redis
 */
export declare const getCellData: (tenantId: string, documentId: string, rowId: string, columnId: string) => Promise<any>;
/**
 * Add a row to the document's row list
 */
export declare const addRow: (tenantId: string, documentId: string, rowId: string, referenceRowId?: string) => Promise<string[]>;
/**
 * Delete a row from the document's row list and all its cells
 */
export declare const deleteRow: (tenantId: string, documentId: string, rowId: string) => Promise<string[]>;
/**
 * Add a column to the document's column list
 */
export declare const addColumn: (tenantId: string, documentId: string, columnId: string, referenceColumnId?: string) => Promise<string[]>;
/**
 * Delete a column from the document's column list and all its cells
 */
export declare const deleteColumn: (tenantId: string, documentId: string, columnId: string) => Promise<string[]>;
/**
 * Get the order of rows for a document
 */
export declare const getRowOrder: (tenantId: string, documentId: string) => Promise<string[]>;
/**
 * Get the order of columns for a document
 */
export declare const getColumnOrder: (tenantId: string, documentId: string) => Promise<string[]>;
/**
 * Initialize empty cells for a new row
 */
export declare const initializeEmptyCellsForRow: (tenantId: string, documentId: string, rowId: string, timestamp: number) => Promise<void>;
/**
 * Get the entire state of a document
 */
export declare const getDocumentState: (tenantId: string, documentId: string) => Promise<{
    rows: string[];
    columns: string[];
    cells: Record<string, Record<string, any>>;
}>;
/**
 * Close Redis connections
 */
export declare const closeRedisConnections: () => Promise<void>;
