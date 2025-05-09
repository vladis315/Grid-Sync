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
    type: 'JoinDocument';
    userId: string;
}
/**
 * Leave document message
 */
export interface LeaveDocumentMessage extends BaseMessage {
    type: 'LeaveDocument';
    userId: string;
}
/**
 * Cell update message
 */
export interface CellUpdateMessage extends BaseMessage {
    type: 'CellUpdate';
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
    type: 'CellUpdateResponse';
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
 * Row add message
 */
export interface RowAddMessage extends BaseMessage {
    type: 'RowAdd';
    rowId: string;
    referenceRow?: string;
    timestamp: number;
}
/**
 * Row add response message
 */
export interface RowAddResponseMessage extends BaseMessage {
    type: 'RowAddResponse';
    rowId: string;
    referenceRow?: string;
    timestamp: number;
    indexOrder: string[];
}
/**
 * Row delete message
 */
export interface RowDeleteMessage extends BaseMessage {
    type: 'RowDelete';
    rowId: string;
    timestamp: number;
}
/**
 * Row delete response message
 */
export interface RowDeleteResponseMessage extends BaseMessage {
    type: 'RowDeleteResponse';
    rowId: string;
    timestamp: number;
    indexOrder: string[];
}
/**
 * Column add message
 */
export interface ColumnAddMessage extends BaseMessage {
    type: 'ColumnAdd';
    columnId: string;
    name: string;
    columnType?: string;
    referenceColumn?: string;
    timestamp: number;
}
/**
 * Column add response message
 */
export interface ColumnAddResponseMessage extends BaseMessage {
    type: 'ColumnAddResponse';
    columnId: string;
    name: string;
    columnType?: string;
    referenceColumn?: string;
    timestamp: number;
    indexOrder: string[];
}
/**
 * Column delete message
 */
export interface ColumnDeleteMessage extends BaseMessage {
    type: 'ColumnDelete';
    columnId: string;
    timestamp: number;
}
/**
 * Column delete response message
 */
export interface ColumnDeleteResponseMessage extends BaseMessage {
    type: 'ColumnDeleteResponse';
    columnId: string;
    timestamp: number;
    indexOrder: string[];
}
/**
 * Init state message
 */
export interface InitStateMessage extends BaseMessage {
    type: 'InitState';
    state: DocumentState;
}
/**
 * Error message
 */
export interface ErrorMessage {
    type: 'Error';
    message: string;
}
/**
 * All possible message types
 */
export type WebSocketMessage = JoinDocumentMessage | LeaveDocumentMessage | CellUpdateMessage | CellUpdateResponseMessage | RowAddMessage | RowAddResponseMessage | RowDeleteMessage | RowDeleteResponseMessage | ColumnAddMessage | ColumnAddResponseMessage | ColumnDeleteMessage | ColumnDeleteResponseMessage | InitStateMessage | ErrorMessage;
