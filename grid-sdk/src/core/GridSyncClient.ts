import { GridSyncConfig, CellUpdateParams, ConnectionStatus, GridSyncMessage } from './types';

/**
 * GridSyncClient - A thin real-time layer for AG Grid
 * 
 * Provides WebSocket-based synchronization of AG Grid data between multiple clients
 */
export class GridSyncClient {
  private socket: WebSocket | null = null;
  private gridApi: any = null;
  private config: GridSyncConfig;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // ms
  private reconnectTimeoutId: number | null = null;

  /**
   * Create a new GridSyncClient
   * @param config - Configuration options
   */
  constructor(config: GridSyncConfig) {
    this.config = config;
    this.setupConnection();
  }

  /**
   * Connect the client to an AG Grid API instance
   * @param gridApi - The AG Grid API object
   */
  public connect(gridApi: any): void {
    this.gridApi = gridApi;
    
    if (this.connectionStatus === 'connected' && this.config.onReady) {
      this.config.onReady(this);
    }
  }

  /**
   * Update a cell value
   * @param params - Cell update parameters
   */
  public updateCell(params: CellUpdateParams): void {
    this.sendMessage({
      type: 'CellUpdate',
      tenantId: this.config.tenantId,
      documentId: this.config.documentId,
      userId: this.config.userId,
      rowId: params.rowId,
      columnId: params.columnId,
      value: params.value,
      timestamp: Date.now()
    });
  }

  /**
   * Disconnect the client and close the WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.connectionStatus = 'disconnected';
  }

  /**
   * Check if the client is connected to the server
   */
  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  /**
   * Set up the WebSocket connection
   */
  private setupConnection(): void {
    if (this.socket) {
      this.socket.close();
    }

    this.connectionStatus = 'connecting';
    
    try {
      // Add the API key as a query parameter to the WebSocket URL
      const url = new URL(this.config.serverUrl);
      if (this.config.apiKey) {
        url.searchParams.append('apiKey', this.config.apiKey);
      }
      
      this.socket = new WebSocket(url.toString());
      
      this.socket.onopen = this.handleOpen;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
      this.socket.onmessage = this.handleMessage;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    
    // Send join document message instead of authentication 
    // (authentication is handled via API key in URL)
    this.sendMessage({
      type: 'JoinDocument',
      tenantId: this.config.tenantId,
      documentId: this.config.documentId,
      userId: this.config.userId
    });

    if (this.gridApi && this.config.onReady) {
      this.config.onReady(this);
    }
  };

  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    this.connectionStatus = 'disconnected';
    
    if (event.code !== 1000) { // Normal closure
      this.attemptReconnect();
    }
  };

  /**
   * Handle WebSocket error event
   */
  private handleError = (error: any): void => {
    this.connectionStatus = 'error';
    
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    this.attemptReconnect();
  };

  /**
   * Handle WebSocket message event
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = JSON.parse(event.data) as GridSyncMessage;
      
      switch (message.type) {
        case 'INIT_STATE':
          if (this.config.onStateChange) {
            this.config.onStateChange(message.state);
          }
          break;
          
        case 'CELL_UPDATE_RESPONSE':
          if (this.config.onStateChange) {
            // Notify app about the updated cell
            this.config.onStateChange({ cells: message.data });
          }
          break;
          
        case 'Error':
          if (this.config.onError) {
            this.config.onError({
              type: 'ServerError',
              message: message.message || 'Unknown server error'
            });
          }
          break;
          
        default:
          // Handle other message types
          console.log('Unhandled message type:', message.type);
          break;
      }
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error);
      }
    }
  };

  /**
   * Send a message to the server
   */
  private sendMessage(message: GridSyncMessage): void {
    if (this.socket && this.connectionStatus === 'connected') {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectAttempts++;
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.setupConnection();
    }, this.reconnectInterval) as unknown as number;
  }
} 