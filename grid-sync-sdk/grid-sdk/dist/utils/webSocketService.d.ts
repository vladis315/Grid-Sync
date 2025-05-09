import { GridSyncConfig, WebSocketMessage, DocumentState } from '../types';
/**
 * WebSocket service for handling real-time communication with the server
 */
export declare class WebSocketService {
    private socket;
    private config;
    private messageListeners;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout;
    private documentState;
    constructor(config: GridSyncConfig);
    /**
     * Connect to the WebSocket server
     */
    connect(): void;
    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void;
    /**
     * Send a message to the server
     */
    sendMessage(message: WebSocketMessage): void;
    /**
     * Add a message listener
     */
    addMessageListener(listener: (message: WebSocketMessage) => void): void;
    /**
     * Remove a message listener
     */
    removeMessageListener(listener: (message: WebSocketMessage) => void): void;
    /**
     * Get the current document state
     */
    getDocumentState(): DocumentState | null;
    /**
     * Join a document
     */
    joinDocument(): void;
    /**
     * Leave a document
     */
    leaveDocument(): void;
    /**
     * Update a cell
     */
    updateCell(rowId: string, columnId: string, value: any, name?: string, cellType?: string): void;
    /**
     * Add a row
     */
    addRow(rowId?: string, referenceRow?: string): void;
    /**
     * Delete a row
     */
    deleteRow(rowId: string): void;
    /**
     * Add a column
     */
    addColumn(columnId: string, name: string, cellType?: string, referenceColumn?: string): void;
    /**
     * Delete a column
     */
    deleteColumn(columnId: string): void;
    /**
     * Handle WebSocket open event
     */
    private handleOpen;
    /**
     * Handle WebSocket message event
     */
    private handleMessage;
    /**
     * Handle WebSocket close event
     */
    private handleClose;
    /**
     * Handle WebSocket error event
     */
    private handleError;
    /**
     * Attempt to reconnect to the WebSocket server
     */
    private reconnect;
}
