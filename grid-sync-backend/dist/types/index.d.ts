/**
 * Tenant information
 */
export interface Tenant {
    id: string;
    name: string;
}
/**
 * Cell data stored in Redis
 */
export interface CellData {
    cellId: string;
    value: any;
    name?: string;
    type?: string;
    timestamp: number;
}
/**
 * Document state with all cells and ordering
 */
export interface DocumentState {
    rows: string[];
    columns: string[];
    cells: Record<string, Record<string, CellData>>;
}
/**
 * Base message interface for WebSocket communication
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
    type: 'JOIN_DOCUMENT';
    userId: string;
}
/**
 * Leave document message
 */
export interface LeaveDocumentMessage extends BaseMessage {
    type: 'LEAVE_DOCUMENT';
    userId: string;
}
/**
 * Cell update message
 */
export interface CellUpdateMessage extends BaseMessage {
    type: 'CELL_UPDATE';
    rowId: string;
    columnId: string;
    cellId?: string;
    value: any;
    name?: string;
    valueType?: string;
    timestamp: number;
}
/**
 * Cell update response message
 */
export interface CellUpdateResponseMessage extends BaseMessage {
    type: 'CELL_UPDATE_RESPONSE';
    rowId: string;
    columnId: string;
    cellId: string;
    value: any;
    name?: string;
    valueType?: string;
    timestamp: number;
    conflict?: boolean;
}
/**
 * Init state message
 */
export interface InitStateMessage extends BaseMessage {
    type: 'INIT_STATE';
    state: DocumentState;
}
/**
 * Error message
 */
export interface ErrorMessage {
    type: 'ERROR';
    message: string;
}
/**
 * All possible message types
 */
export type WebSocketMessage = JoinDocumentMessage | LeaveDocumentMessage | CellUpdateMessage | CellUpdateResponseMessage | InitStateMessage | ErrorMessage;
