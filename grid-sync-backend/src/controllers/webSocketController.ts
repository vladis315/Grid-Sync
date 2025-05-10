import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { 
  setCellData, 
  getCellData, 
  getDocumentState, 
  publishToDocumentChannel, 
  subscribeToDocumentChannel, 
  unsubscribeFromDocumentChannel, 
  getRedisClient 
} from '../services/redisService';
import { MESSAGE_TYPES } from '../types/messageTypes';

// Store connected clients by documentId
interface ConnectedClient {
  ws: WebSocket & { tenantId?: string };
  tenantId: string;
  userId: string;
}

// Map of document connections: documentId -> array of clients
const documentConnections: Record<string, ConnectedClient[]> = {};

/**
 * Message types for WebSocket communication
 */
const MessageType = MESSAGE_TYPES;

/**
 * Setup WebSocket handlers
 */
export const setupWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WebSocket & { tenantId?: string }) => {
    console.log('Client connected');

    // Handle WebSocket messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (!data.type) {
          sendError(ws, 'Invalid message format: missing type');
          return;
        }
        
        // Check if tenantId in message matches the one authenticated in the connection
        if (ws.tenantId && data.tenantId && ws.tenantId !== data.tenantId) {
          sendError(ws, 'Tenant ID mismatch');
          return;
        }
        
        // Handle different message types
        switch (data.type) {
          case MessageType.JOIN_DOCUMENT:
            await handleJoinDocument(ws, data);
            break;
            
          case MessageType.LEAVE_DOCUMENT:
            await handleLeaveDocument(ws, data);
            break;
            
          case MessageType.CELL_UPDATE:
            await handleCellUpdate(ws, data);
            break;
            
          default:
            sendError(ws, `Unknown message type: ${data.type}`);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
        sendError(ws, 'Error processing message');
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      
      // Remove client from all document connections
      for (const documentKey in documentConnections) {
        documentConnections[documentKey] = documentConnections[documentKey].filter(
          client => client.ws !== ws
        );
        
        // If no more clients for this document, unsubscribe from channel
        if (documentConnections[documentKey].length === 0) {
          const [tenantId, documentId] = documentKey.split(':');
          unsubscribeFromDocumentChannel(tenantId, documentId);
          delete documentConnections[documentKey];
        }
      }
    });
  });
};

/**
 * Handle JOIN_DOCUMENT message
 */
async function handleJoinDocument(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { tenantId, documentId, userId } = data;
  
  if (!tenantId || !documentId || !userId) {
    sendError(ws, 'Missing required fields for JOIN_DOCUMENT');
    return;
  }
  
  // Store client connection
  const documentKey = `${tenantId}:${documentId}`;
  if (!documentConnections[documentKey]) {
    documentConnections[documentKey] = [];
  }
  
  // Add client to document connections
  documentConnections[documentKey].push({ ws, tenantId, userId });
  
  // Subscribe to document channel for real-time updates
  await subscribeToDocumentChannel(tenantId, documentId, (message) => {
    // Broadcast to all clients connected to this document
    for (const client of documentConnections[documentKey]) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  });
  
  // First, check if we have state in Redis
  let state = await getDocumentState(tenantId, documentId);
  
  // If Redis has no data or is empty, load from the database
  if (!state || !state.rows || state.rows.length === 0) {
    try {
      // Fetch data from the persistence API
      const apiUrl = process.env.PERSISTENCE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/documents/${tenantId}/${documentId}`);
      
      if (response.ok) {
        const data = await response.json();
        state = data.state;
        
        // Buffer all cells in Redis
        if (state && state.cells) {
          for (const rowId in state.cells) {
            for (const columnId in state.cells[rowId]) {
              const cellData = state.cells[rowId][columnId];
              await setCellData(tenantId, documentId, rowId, columnId, cellData);
            }
          }
        }
        
        // Store row and column orders
        if (state.rows && state.rows.length > 0) {
          const rowsKey = `tenant:${tenantId}:doc:${documentId}:rows`;
          const redisClient = getRedisClient();
          await redisClient.del(rowsKey);
          await redisClient.rPush(rowsKey, state.rows);
        }
        
        if (state.columns && state.columns.length > 0) {
          const columnsKey = `tenant:${tenantId}:doc:${documentId}:columns`;
          const redisClient = getRedisClient();
          await redisClient.del(columnsKey);
          await redisClient.rPush(columnsKey, state.columns);
        }
      } else {
        console.error('Failed to fetch document data from database:', await response.text());
      }
    } catch (error) {
      console.error('Error loading document data from database:', error);
    }
  }
  
  // Send state to client
  ws.send(JSON.stringify({
    type: MessageType.INIT_STATE,
    tenantId,
    documentId,
    state
  }));
}

/**
 * Handle LEAVE_DOCUMENT message
 */
async function handleLeaveDocument(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { tenantId, documentId, userId } = data;
  
  if (!tenantId || !documentId || !userId) {
    sendError(ws, 'Missing required fields for LEAVE_DOCUMENT');
    return;
  }
  
  const documentKey = `${tenantId}:${documentId}`;
  
  // Remove client from document connections
  if (documentConnections[documentKey]) {
    documentConnections[documentKey] = documentConnections[documentKey].filter(
      client => client.ws !== ws || client.userId !== userId
    );
    
    // If no more clients for this document, unsubscribe from channel
    if (documentConnections[documentKey].length === 0) {
      await unsubscribeFromDocumentChannel(tenantId, documentId);
      delete documentConnections[documentKey];
    }
  }
}

/**
 * Handle CELL_UPDATE message
 */
async function handleCellUpdate(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { 
    tenantId, 
    documentId, 
    tableId, 
    rowId, 
    columnId, 
    cellId, 
    value, 
    name, 
    type, 
    timestamp 
  } = data;
  
  if (!tenantId || !documentId || !rowId || !columnId || timestamp === undefined) {
    sendError(ws, 'Missing required fields for CELL_UPDATE');
    return;
  }
  
  // Check for existing cell data
  const existingCellData = await getCellData(tenantId, documentId, rowId, columnId);
  
  // Implement Last-Write-Wins conflict resolution
  if (existingCellData && existingCellData.timestamp > timestamp) {
    // Existing cell has a newer timestamp, send back the current state
    ws.send(JSON.stringify({
      type: MessageType.CELL_UPDATE_RESPONSE,
      tenantId,
      documentId,
      tableId,
      rowId,
      columnId,
      cellId: existingCellData.cellId,
      value: existingCellData.value,
      name: existingCellData.name,
      valueType: existingCellData.type,
      timestamp: existingCellData.timestamp,
      conflict: true
    }));
    return;
  }
  
  // Prepare cell data to store
  const cellData = {
    cellId: cellId || uuidv4(),
    value,
    name,
    type,
    timestamp
  };
  
  // Store cell data in Redis
  await setCellData(tenantId, documentId, rowId, columnId, cellData);
  
  // Prepare response message
  const responseMessage = {
    type: MessageType.CELL_UPDATE_RESPONSE,
    tenantId,
    documentId,
    tableId,
    rowId,
    columnId,
    cellId: cellData.cellId,
    value,
    name,
    valueType: type,
    timestamp
  };
  
  // Publish update to document channel
  await publishToDocumentChannel(tenantId, documentId, responseMessage);
  
  // Also save to database (new persistence layer)
  try {
    // Make a request to the persistence API
    const apiUrl = process.env.PERSISTENCE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/cells`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cellId: cellData.cellId,
        rowId,
        columnId,
        documentId,
        tenantId,
        value,
        name,
        type,
        timestamp
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to persist cell data:', await response.text());
    }
  } catch (error) {
    console.error('Error persisting cell data:', error);
  }
}

/**
 * Send error message to client
 */
function sendError(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: MessageType.ERROR,
      message
    }));
  }
} 