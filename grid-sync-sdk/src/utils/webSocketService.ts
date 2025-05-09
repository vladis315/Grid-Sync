import { v4 as uuidv4 } from 'uuid';
import {
  MessageType,
  GridSyncConfig,
  WebSocketMessage,
  DocumentState,
  CellUpdateMessage,
  RowAddMessage,
  RowDeleteMessage,
  ColumnAddMessage,
  ColumnDeleteMessage,
  ColumnAddResponseMessage
} from '../types';

/**
 * WebSocket service for handling real-time communication with the server
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private config: GridSyncConfig;
  private messageListeners: Array<(message: WebSocketMessage) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private documentState: DocumentState | null = null;

  constructor(config: GridSyncConfig) {
    this.config = config;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
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
  public disconnect(): void {
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
  public sendMessage(message: WebSocketMessage): void {
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
  public addMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners.push(listener);
  }

  /**
   * Remove a message listener
   */
  public removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  /**
   * Get the current document state
   */
  public getDocumentState(): DocumentState | null {
    return this.documentState;
  }

  /**
   * Join a document
   */
  public joinDocument(): void {
    const { tenantId, documentId, userId, tableId } = this.config;
    
    this.sendMessage({
      type: MessageType.JOIN_DOCUMENT,
      tenantId,
      documentId,
      tableId,
      userId
    });
  }

  /**
   * Leave a document
   */
  public leaveDocument(): void {
    const { tenantId, documentId, userId, tableId } = this.config;
    
    this.sendMessage({
      type: MessageType.LEAVE_DOCUMENT,
      tenantId,
      documentId,
      tableId,
      userId
    });
  }

  /**
   * Update a cell
   */
  public updateCell(
    rowId: string, 
    columnId: string, 
    value: any, 
    name?: string, 
    cellType?: string
  ): void {
    const { tenantId, documentId, tableId } = this.config;
    
    const message: CellUpdateMessage = {
      type: MessageType.CELL_UPDATE,
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
  public addRow(rowId: string = uuidv4(), referenceRow?: string): void {
    const { tenantId, documentId, tableId } = this.config;
    
    const message: RowAddMessage = {
      type: MessageType.ROW_ADD,
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
  public deleteRow(rowId: string): void {
    const { tenantId, documentId, tableId } = this.config;
    
    const message: RowDeleteMessage = {
      type: MessageType.ROW_DELETE,
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
  public addColumn(
    columnId: string, 
    name: string, 
    cellType?: string, 
    referenceColumn?: string
  ): void {
    const { tenantId, documentId, tableId } = this.config;
    
    const message: ColumnAddMessage = {
      type: MessageType.COLUMN_ADD,
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
  public deleteColumn(columnId: string): void {
    const { tenantId, documentId, tableId } = this.config;
    
    const message: ColumnDeleteMessage = {
      type: MessageType.COLUMN_DELETE,
      tenantId,
      documentId,
      tableId,
      columnId,
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    console.log('WebSocket connected');
    
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Join the document
    this.joinDocument();
  };

  /**
   * Handle WebSocket message event
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log('[DEBUG] Raw message received from server:', event.data);
      
      // Handle init state message
      if (message.type === MessageType.INIT_STATE) {
        this.documentState = message.state;
        console.log('[DEBUG] INIT_STATE received, state updated', {
          rows: message.state.rows.length,
          columns: message.state.columns.length
        });
        
        // Notify state change listeners
        if (this.config.onStateChange) {
          this.config.onStateChange(message.state);
        }
      } else if (message.type === MessageType.COLUMN_ADD_RESPONSE) {
        console.log('[DEBUG] COLUMN_ADD_RESPONSE received:', {
          columnId: (message as ColumnAddResponseMessage).columnId,
          indexOrder: (message as ColumnAddResponseMessage).indexOrder
        });
      }
      
      // Notify message listeners
      this.messageListeners.forEach(listener => listener(message));
    } catch (error) {
      console.error('[DEBUG] Error parsing WebSocket message:', error, 'Raw data:', event.data);
    }
  };

  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    // Try to reconnect
    this.reconnect();
  };

  /**
   * Handle WebSocket error event
   */
  private handleError = (event: Event): void => {
    console.error('WebSocket error:', event);
    
    // Notify error listeners
    if (this.config.onError) {
      this.config.onError('WebSocket error');
    }
  };

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect = (): void => {
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
} 