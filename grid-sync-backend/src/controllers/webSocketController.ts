import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  publishToDocumentChannel,
  subscribeToDocumentChannel,
  unsubscribeFromDocumentChannel,
  setCellData,
  getCellData,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  getDocumentState,
  initializeEmptyCellsForRow
} from '../services/redisService';

// Store connected clients by documentId
interface ConnectedClient {
  ws: WebSocket;
  tenantId: string;
  userId: string;
}

// Map of document connections: documentId -> array of clients
const documentConnections: Record<string, ConnectedClient[]> = {};

/**
 * Message types for WebSocket communication
 */
enum MessageType {
  JOIN_DOCUMENT = 'JoinDocument',
  LEAVE_DOCUMENT = 'LeaveDocument',
  CELL_UPDATE = 'CellUpdate',
  ROW_ADD = 'RowAdd',
  ROW_DELETE = 'RowDelete',
  COLUMN_ADD = 'ColumnAdd',
  COLUMN_DELETE = 'ColumnDelete',
  INIT_STATE = 'InitState',
  CELL_UPDATE_RESPONSE = 'CellUpdateResponse',
  ROW_ADD_RESPONSE = 'RowAddResponse',
  ROW_DELETE_RESPONSE = 'RowDeleteResponse',
  COLUMN_ADD_RESPONSE = 'ColumnAddResponse',
  COLUMN_DELETE_RESPONSE = 'ColumnDeleteResponse',
  ERROR = 'Error'
}

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
            
          case MessageType.ROW_ADD:
            await handleRowAdd(ws, data);
            break;
            
          case MessageType.ROW_DELETE:
            await handleRowDelete(ws, data);
            break;
            
          case MessageType.COLUMN_ADD:
            await handleColumnAdd(ws, data);
            break;
            
          case MessageType.COLUMN_DELETE:
            await handleColumnDelete(ws, data);
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
      for (const documentId in documentConnections) {
        documentConnections[documentId] = documentConnections[documentId].filter(
          client => client.ws !== ws
        );
        
        // Clean up empty arrays
        if (documentConnections[documentId].length === 0) {
          delete documentConnections[documentId];
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
  
  // Fetch initial document state
  const state = await getDocumentState(tenantId, documentId);
  
  // Send initial state to client
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
}

/**
 * Handle ROW_ADD message
 */
async function handleRowAdd(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { 
    tenantId, 
    documentId, 
    tableId, 
    rowId, 
    referenceRow, 
    timestamp 
  } = data;
  
  if (!tenantId || !documentId || !rowId || timestamp === undefined) {
    sendError(ws, 'Missing required fields for ROW_ADD');
    return;
  }
  
  // Add row to document and get updated order
  const updatedRowOrder = await addRow(tenantId, documentId, rowId, referenceRow);
  
  // Initialize empty cells for the new row
  await initializeEmptyCellsForRow(tenantId, documentId, rowId, timestamp);
  
  // Prepare response message
  const responseMessage = {
    type: MessageType.ROW_ADD_RESPONSE,
    tenantId,
    documentId,
    tableId,
    rowId,
    referenceRow,
    timestamp,
    indexOrder: updatedRowOrder
  };
  
  // Publish update to document channel
  await publishToDocumentChannel(tenantId, documentId, responseMessage);
}

/**
 * Handle ROW_DELETE message
 */
async function handleRowDelete(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { 
    tenantId, 
    documentId, 
    tableId, 
    rowId, 
    timestamp 
  } = data;
  
  if (!tenantId || !documentId || !rowId) {
    sendError(ws, 'Missing required fields for ROW_DELETE');
    return;
  }
  
  // Delete row and all its cells
  const updatedRowOrder = await deleteRow(tenantId, documentId, rowId);
  
  // Prepare response message
  const responseMessage = {
    type: MessageType.ROW_DELETE_RESPONSE,
    tenantId,
    documentId,
    tableId,
    rowId,
    timestamp,
    indexOrder: updatedRowOrder
  };
  
  // Publish update to document channel
  await publishToDocumentChannel(tenantId, documentId, responseMessage);
}

/**
 * Handle COLUMN_ADD message
 */
async function handleColumnAdd(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { 
    tenantId, 
    documentId, 
    tableId, 
    columnId, 
    name, 
    type, 
    referenceColumn, 
    timestamp 
  } = data;
  
  if (!tenantId || !documentId || !columnId || !name) {
    sendError(ws, 'Missing required fields for COLUMN_ADD');
    return;
  }
  
  // Add column to document and get updated order
  const updatedColumnOrder = await addColumn(tenantId, documentId, columnId, referenceColumn);
  
  // Prepare response message
  const responseMessage = {
    type: MessageType.COLUMN_ADD_RESPONSE,
    tenantId,
    documentId,
    tableId,
    columnId,
    name,
    columnType: type,
    referenceColumn,
    timestamp,
    indexOrder: updatedColumnOrder
  };
  
  // Publish update to document channel
  await publishToDocumentChannel(tenantId, documentId, responseMessage);
}

/**
 * Handle COLUMN_DELETE message
 */
async function handleColumnDelete(
  ws: WebSocket & { tenantId?: string },
  data: any
) {
  const { 
    tenantId, 
    documentId, 
    tableId, 
    columnId, 
    timestamp 
  } = data;
  
  if (!tenantId || !documentId || !columnId) {
    sendError(ws, 'Missing required fields for COLUMN_DELETE');
    return;
  }
  
  // Delete column and all its cells
  const updatedColumnOrder = await deleteColumn(tenantId, documentId, columnId);
  
  // Prepare response message
  const responseMessage = {
    type: MessageType.COLUMN_DELETE_RESPONSE,
    tenantId,
    documentId,
    tableId,
    columnId,
    timestamp,
    indexOrder: updatedColumnOrder
  };
  
  // Publish update to document channel
  await publishToDocumentChannel(tenantId, documentId, responseMessage);
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