"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../types");
/**
 * WebSocket service for handling real-time communication with the server
 */
class WebSocketService {
    constructor(config) {
        this.socket = null;
        this.messageListeners = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.documentState = null;
        /**
         * Handle WebSocket open event
         */
        this.handleOpen = () => {
            console.log('WebSocket connected');
            // Reset reconnect attempts
            this.reconnectAttempts = 0;
            // Join the document
            this.joinDocument();
        };
        /**
         * Handle WebSocket message event
         */
        this.handleMessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('[DEBUG] Raw message received from server:', event.data);
                // Handle init state message
                if (message.type === types_1.MessageType.INIT_STATE) {
                    this.documentState = message.state;
                    console.log('[DEBUG] INIT_STATE received, state updated', {
                        rows: message.state.rows.length,
                        columns: message.state.columns.length
                    });
                    // Notify state change listeners
                    if (this.config.onStateChange) {
                        this.config.onStateChange(message.state);
                    }
                }
                else if (message.type === types_1.MessageType.COLUMN_ADD_RESPONSE) {
                    console.log('[DEBUG] COLUMN_ADD_RESPONSE received:', {
                        columnId: message.columnId,
                        indexOrder: message.indexOrder
                    });
                }
                // Notify message listeners
                this.messageListeners.forEach(listener => listener(message));
            }
            catch (error) {
                console.error('[DEBUG] Error parsing WebSocket message:', error, 'Raw data:', event.data);
            }
        };
        /**
         * Handle WebSocket close event
         */
        this.handleClose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            // Try to reconnect
            this.reconnect();
        };
        /**
         * Handle WebSocket error event
         */
        this.handleError = (event) => {
            console.error('WebSocket error:', event);
            // Notify error listeners
            if (this.config.onError) {
                this.config.onError('WebSocket error');
            }
        };
        /**
         * Attempt to reconnect to the WebSocket server
         */
        this.reconnect = () => {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnect attempts reached');
                // Notify error listeners
                if (this.config.onError) {
                    this.config.onError('Failed to reconnect to server');
                }
                return;
            }
            // Increment reconnect attempts
            this.reconnectAttempts++;
            // Exponential backoff
            const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            // Set timeout to reconnect
            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, delay);
        };
        this.config = config;
    }
    /**
     * Connect to the WebSocket server
     */
    connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }
        // Create WebSocket connection
        const { serverUrl, apiKey } = this.config;
        // Include API key in the URL as query parameter
        const wsUrl = serverUrl.includes('?')
            ? `${serverUrl}&apiKey=${apiKey}`
            : `${serverUrl}?apiKey=${apiKey}`;
        this.socket = new WebSocket(wsUrl);
        // Handle WebSocket events
        this.socket.onopen = this.handleOpen;
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = this.handleError;
    }
    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.socket) {
            // Send leave document message
            this.leaveDocument();
            // Close the connection
            this.socket.close();
            this.socket = null;
        }
        // Clear any reconnect timeouts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
    /**
     * Send a message to the server
     */
    sendMessage(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('[DEBUG] WebSocket not connected when trying to send message:', message.type);
            if (this.config.onError) {
                this.config.onError('WebSocket not connected');
            }
            return;
        }
        console.log('[DEBUG] Sending message to server:', {
            type: message.type,
            tenantId: 'tenantId' in message ? message.tenantId : undefined,
            documentId: 'documentId' in message ? message.documentId : undefined,
            timestamp: 'timestamp' in message ? message.timestamp : undefined
        });
        this.socket.send(JSON.stringify(message));
    }
    /**
     * Add a message listener
     */
    addMessageListener(listener) {
        this.messageListeners.push(listener);
    }
    /**
     * Remove a message listener
     */
    removeMessageListener(listener) {
        this.messageListeners = this.messageListeners.filter(l => l !== listener);
    }
    /**
     * Get the current document state
     */
    getDocumentState() {
        return this.documentState;
    }
    /**
     * Join a document
     */
    joinDocument() {
        const { tenantId, documentId, userId, tableId } = this.config;
        this.sendMessage({
            type: types_1.MessageType.JOIN_DOCUMENT,
            tenantId,
            documentId,
            tableId,
            userId
        });
    }
    /**
     * Leave a document
     */
    leaveDocument() {
        const { tenantId, documentId, userId, tableId } = this.config;
        this.sendMessage({
            type: types_1.MessageType.LEAVE_DOCUMENT,
            tenantId,
            documentId,
            tableId,
            userId
        });
    }
    /**
     * Update a cell
     */
    updateCell(rowId, columnId, value, name, cellType) {
        const { tenantId, documentId, tableId } = this.config;
        const message = {
            type: types_1.MessageType.CELL_UPDATE,
            tenantId,
            documentId,
            tableId,
            rowId,
            columnId,
            value,
            name,
            cellType,
            timestamp: Date.now()
        };
        this.sendMessage(message);
    }
    /**
     * Add a row
     */
    addRow(rowId = (0, uuid_1.v4)(), referenceRow) {
        const { tenantId, documentId, tableId } = this.config;
        const message = {
            type: types_1.MessageType.ROW_ADD,
            tenantId,
            documentId,
            tableId,
            rowId,
            referenceRow,
            timestamp: Date.now()
        };
        this.sendMessage(message);
    }
    /**
     * Delete a row
     */
    deleteRow(rowId) {
        const { tenantId, documentId, tableId } = this.config;
        const message = {
            type: types_1.MessageType.ROW_DELETE,
            tenantId,
            documentId,
            tableId,
            rowId,
            timestamp: Date.now()
        };
        this.sendMessage(message);
    }
    /**
     * Add a column
     */
    addColumn(columnId, name, cellType, referenceColumn) {
        const { tenantId, documentId, tableId } = this.config;
        const message = {
            type: types_1.MessageType.COLUMN_ADD,
            tenantId,
            documentId,
            tableId,
            columnId,
            name,
            cellType,
            referenceColumn,
            timestamp: Date.now()
        };
        this.sendMessage(message);
    }
    /**
     * Delete a column
     */
    deleteColumn(columnId) {
        const { tenantId, documentId, tableId } = this.config;
        const message = {
            type: types_1.MessageType.COLUMN_DELETE,
            tenantId,
            documentId,
            tableId,
            columnId,
            timestamp: Date.now()
        };
        this.sendMessage(message);
    }
}
exports.WebSocketService = WebSocketService;
