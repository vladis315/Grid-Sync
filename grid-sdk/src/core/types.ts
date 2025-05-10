/**
 * Configuration for the GridSyncClient
 */
export interface GridSyncConfig {
  /** WebSocket server URL */
  serverUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Tenant identifier for multi-tenant isolation */
  tenantId?: string;
  /** Document identifier */
  documentId?: string;
  /** User identifier */
  userId?: string;
  /** Called when client is ready and connected to grid API */
  onReady?: (client: any) => void;
  /** Called on connection or processing errors */
  onError?: (error: any) => void;
  /** Called when state changes are received from server */
  onStateChange?: (state: any) => void;
}

/**
 * Parameters for updating a cell
 */
export interface CellUpdateParams {
  /** Row identifier */
  rowId: string;
  /** Column identifier */
  columnId: string;
  /** New cell value */
  value: any;
}

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Message types for WebSocket communication
 */
export type GridSyncMessage = {
  type: string;
  data?: any;
  tenantId?: string;
  documentId?: string;
  userId?: string;
  rowId?: string;
  columnId?: string;
  value?: any;
  timestamp?: number;
  state?: any;
  message?: string;
} 