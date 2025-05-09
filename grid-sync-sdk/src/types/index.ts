/**
 * Message types for WebSocket communication
 */
export enum MessageType {
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
 * Cell data structure
 */
export interface CellData {
  cellId: string;
  value: any;
  name?: string;
  cellType?: string;
  timestamp: number;
}

/**
 * Document state
 */
export interface DocumentState {
  rows: string[];
  columns: string[];
  cells: Record<string, Record<string, CellData>>;
}

/**
 * Base message interface
 */
export interface BaseMessage {
  type: string;
  tenantId: string;
  documentId: string;
  tableId?: string;
}

/**
 * Join document message
 */
export interface JoinDocumentMessage extends BaseMessage {
  type: MessageType.JOIN_DOCUMENT;
  userId: string;
}

/**
 * Leave document message
 */
export interface LeaveDocumentMessage extends BaseMessage {
  type: MessageType.LEAVE_DOCUMENT;
  userId: string;
}

/**
 * Cell update message
 */
export interface CellUpdateMessage extends BaseMessage {
  type: MessageType.CELL_UPDATE;
  rowId: string;
  columnId: string;
  cellId?: string;
  value: any;
  name?: string;
  cellType?: string;
  timestamp: number;
}

/**
 * Cell update response message
 */
export interface CellUpdateResponseMessage extends BaseMessage {
  type: MessageType.CELL_UPDATE_RESPONSE;
  rowId: string;
  columnId: string;
  cellId: string;
  value: any;
  name?: string;
  cellType?: string;
  timestamp: number;
  conflict?: boolean;
}

/**
 * Row add message
 */
export interface RowAddMessage extends BaseMessage {
  type: MessageType.ROW_ADD;
  rowId: string;
  referenceRow?: string;
  timestamp: number;
}

/**
 * Row add response message
 */
export interface RowAddResponseMessage extends BaseMessage {
  type: MessageType.ROW_ADD_RESPONSE;
  rowId: string;
  referenceRow?: string;
  timestamp: number;
  indexOrder: string[];
}

/**
 * Row delete message
 */
export interface RowDeleteMessage extends BaseMessage {
  type: MessageType.ROW_DELETE;
  rowId: string;
  timestamp: number;
}

/**
 * Row delete response message
 */
export interface RowDeleteResponseMessage extends BaseMessage {
  type: MessageType.ROW_DELETE_RESPONSE;
  rowId: string;
  timestamp: number;
  indexOrder: string[];
}

/**
 * Column add message
 */
export interface ColumnAddMessage extends BaseMessage {
  type: MessageType.COLUMN_ADD;
  columnId: string;
  name: string;
  cellType?: string;
  referenceColumn?: string;
  timestamp: number;
}

/**
 * Column add response message
 */
export interface ColumnAddResponseMessage extends BaseMessage {
  type: MessageType.COLUMN_ADD_RESPONSE;
  columnId: string;
  name: string;
  cellType?: string;
  referenceColumn?: string;
  timestamp: number;
  indexOrder: string[];
}

/**
 * Column delete message
 */
export interface ColumnDeleteMessage extends BaseMessage {
  type: MessageType.COLUMN_DELETE;
  columnId: string;
  timestamp: number;
}

/**
 * Column delete response message
 */
export interface ColumnDeleteResponseMessage extends BaseMessage {
  type: MessageType.COLUMN_DELETE_RESPONSE;
  columnId: string;
  timestamp: number;
  indexOrder: string[];
}

/**
 * Init state message
 */
export interface InitStateMessage extends BaseMessage {
  type: MessageType.INIT_STATE;
  state: DocumentState;
}

/**
 * Error message
 */
export interface ErrorMessage {
  type: MessageType.ERROR;
  message: string;
}

/**
 * All possible message types
 */
export type WebSocketMessage =
  | JoinDocumentMessage
  | LeaveDocumentMessage
  | CellUpdateMessage
  | CellUpdateResponseMessage
  | RowAddMessage
  | RowAddResponseMessage
  | RowDeleteMessage
  | RowDeleteResponseMessage
  | ColumnAddMessage
  | ColumnAddResponseMessage
  | ColumnDeleteMessage
  | ColumnDeleteResponseMessage
  | InitStateMessage
  | ErrorMessage;

/**
 * GridSync configuration
 */
export interface GridSyncConfig {
  serverUrl: string;
  apiKey: string;
  tenantId: string;
  documentId: string;
  tableId?: string;
  userId: string;
  onStateChange?: (state: DocumentState) => void;
  onError?: (error: string) => void;
  onReady?: (api: {
    updateCell: (rowId: string, columnId: string, value: any, name?: string, cellType?: string) => void;
  }) => void;
}

/**
 * AG Grid specific configuration
 */
export interface AgGridSyncProps {
  gridSyncConfig: GridSyncConfig;
  modules?: any[];
  // AG Grid component props can be extended here
  [key: string]: any;
} 