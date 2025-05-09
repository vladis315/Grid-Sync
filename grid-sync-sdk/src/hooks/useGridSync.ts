import * as React from 'react';
import { WebSocketService } from '../utils/webSocketService';
import { 
  GridSyncConfig, 
  DocumentState, 
  MessageType, 
  WebSocketMessage
} from '../types';

// Check if React is properly loaded
if (!React || !React.useState) {
  console.error('React is not properly loaded or multiple React instances detected');
}

/**
 * Hook for using GridSync in React components
 */
export const useGridSync = (config: GridSyncConfig) => {
  // Use React directly to ensure we're using the correct instance
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [state, setState] = React.useState<DocumentState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  // Use ref to maintain instance across renders
  const wsServiceRef = React.useRef<WebSocketService | null>(null);
  
  console.log('[DEBUG] useGridSync initialized with config:', {
    serverUrl: config.serverUrl,
    tenantId: config.tenantId,
    documentId: config.documentId,
    tableId: config.tableId
  });
  
  // Create a modified config that uses our setState
  const configWithHandlers = {
    ...config,
    onStateChange: (newState: DocumentState) => {
      console.log('[DEBUG] State change received:', {
        rows: newState.rows.length,
        columns: newState.columns.length,
        columnIds: newState.columns
      });
      setState(newState);
      if (config.onStateChange) {
        config.onStateChange(newState);
      }
    },
    onError: (errorMessage: string) => {
      console.error('[DEBUG] GridSync error:', errorMessage);
      setError(errorMessage);
      if (config.onError) {
        config.onError(errorMessage);
      }
    }
  };
  
  // Initialize WebSocketService
  React.useEffect(() => {
    wsServiceRef.current = new WebSocketService(configWithHandlers);
    
    console.log('[DEBUG] WebSocketService created, connecting...');
    
    // Connect to server
    wsServiceRef.current.connect();
    setIsConnected(true);
    
    // Add message listener
    const handleMessage = (message: WebSocketMessage) => {
      console.log('[DEBUG] WebSocket message received:', {
        type: message.type,
        tenantId: 'tenantId' in message ? message.tenantId : undefined,
        documentId: 'documentId' in message ? message.documentId : undefined
      });
      
      // Handle connection status
      if (message.type === MessageType.INIT_STATE) {
        setIsConnected(true);
        console.log('[DEBUG] INIT_STATE received, connected to server');
      } else if (message.type === MessageType.ERROR) {
        setError(message.message);
        console.error('[DEBUG] ERROR message from server:', message.message);
      }
    };
    
    wsServiceRef.current.addMessageListener(handleMessage);
    
    // Cleanup on unmount
    return () => {
      console.log('[DEBUG] Cleaning up WebSocketService');
      if (wsServiceRef.current) {
        wsServiceRef.current.removeMessageListener(handleMessage);
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, []);
  
  // Cell update function
  const updateCell = React.useCallback((rowId: string, columnId: string, value: any, name?: string, cellType?: string) => {
    console.log('[DEBUG] updateCell called:', { rowId, columnId, value });
    if (wsServiceRef.current) {
      wsServiceRef.current.updateCell(rowId, columnId, value, name, cellType);
    } else {
      console.error('[DEBUG] Cannot update cell - WebSocketService is not initialized');
    }
  }, []);
  
  return {
    isConnected,
    state,
    error,
    updateCell
  };
}; 