/**
 * Message types for WebSocket communication
 */
export enum MessageType {
  JOIN_DOCUMENT = 'JoinDocument',
  LEAVE_DOCUMENT = 'LeaveDocument',
  CELL_UPDATE = 'CellUpdate',
  INIT_STATE = 'InitState',
  CELL_UPDATE_RESPONSE = 'CellUpdateResponse',
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
  | InitStateMessage
  | ErrorMessage;

/**
 * GridSync API interface
 */
export interface GridSyncApi {
  updateCell: (rowId: string, columnId: string, value: any, name?: string, cellType?: string) => void;
}

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
  onReady?: (api: GridSyncApi) => void;
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