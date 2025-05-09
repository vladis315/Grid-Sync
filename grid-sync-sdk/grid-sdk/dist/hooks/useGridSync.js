"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGridSync = void 0;
const React = __importStar(require("react"));
const webSocketService_1 = require("../utils/webSocketService");
const types_1 = require("../types");
// Check if React is properly loaded
if (!React || !React.useState) {
    console.error('React is not properly loaded or multiple React instances detected');
}
/**
 * Hook for using GridSync in React components
 */
const useGridSync = (config) => {
    // Use React directly to ensure we're using the correct instance
    const [isConnected, setIsConnected] = React.useState(false);
    const [state, setState] = React.useState(null);
    const [error, setError] = React.useState(null);
    // Use ref to maintain instance across renders
    const wsServiceRef = React.useRef(null);
    console.log('[DEBUG] useGridSync initialized with config:', {
        serverUrl: config.serverUrl,
        tenantId: config.tenantId,
        documentId: config.documentId,
        tableId: config.tableId
    });
    // Create a modified config that uses our setState
    const configWithHandlers = {
        ...config,
        onStateChange: (newState) => {
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
        onError: (errorMessage) => {
            console.error('[DEBUG] GridSync error:', errorMessage);
            setError(errorMessage);
            if (config.onError) {
                config.onError(errorMessage);
            }
        }
    };
    // Initialize WebSocketService
    React.useEffect(() => {
        wsServiceRef.current = new webSocketService_1.WebSocketService(configWithHandlers);
        console.log('[DEBUG] WebSocketService created, connecting...');
        // Connect to server
        wsServiceRef.current.connect();
        setIsConnected(true);
        // Add message listener
        const handleMessage = (message) => {
            console.log('[DEBUG] WebSocket message received:', {
                type: message.type,
                tenantId: 'tenantId' in message ? message.tenantId : undefined,
                documentId: 'documentId' in message ? message.documentId : undefined
            });
            // Handle connection status
            if (message.type === types_1.MessageType.INIT_STATE) {
                setIsConnected(true);
                console.log('[DEBUG] INIT_STATE received, connected to server');
            }
            else if (message.type === types_1.MessageType.ERROR) {
                setError(message.message);
                console.error('[DEBUG] ERROR message from server:', message.message);
            }
            else if (message.type === types_1.MessageType.COLUMN_ADD_RESPONSE) {
                // Check for duplicate columns in indexOrder
                const columnAddMsg = message;
                const uniqueColumns = [...new Set(columnAddMsg.indexOrder)];
                if (uniqueColumns.length !== columnAddMsg.indexOrder.length) {
                    console.warn('[DEBUG] Duplicate columns detected in COLUMN_ADD_RESPONSE:', {
                        indexOrder: columnAddMsg.indexOrder,
                        uniqueIndexOrder: uniqueColumns,
                        duplicates: columnAddMsg.indexOrder.filter((col, index) => columnAddMsg.indexOrder.indexOf(col) !== index)
                    });
                    // Fix the state to prevent ag-Grid errors
                    if (state) {
                        console.log('[DEBUG] Applying fix for duplicate columns');
                        // Create a fixed state with deduplicated columns
                        const fixedState = {
                            ...state,
                            columns: uniqueColumns
                        };
                        // Update the state
                        setState(fixedState);
                        console.log('[DEBUG] State updated with fixed column list');
                    }
                }
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
    const updateCell = React.useCallback((rowId, columnId, value, name, cellType) => {
        console.log('[DEBUG] updateCell called:', { rowId, columnId, value });
        if (wsServiceRef.current) {
            wsServiceRef.current.updateCell(rowId, columnId, value, name, cellType);
        }
        else {
            console.error('[DEBUG] Cannot update cell - WebSocketService is not initialized');
        }
    }, []);
    // Row add function
    const addRow = React.useCallback((rowId, referenceRow) => {
        console.log('[DEBUG] addRow called:', { rowId, referenceRow });
        if (wsServiceRef.current) {
            wsServiceRef.current.addRow(rowId, referenceRow);
        }
        else {
            console.error('[DEBUG] Cannot add row - WebSocketService is not initialized');
        }
    }, []);
    // Row delete function
    const deleteRow = React.useCallback((rowId) => {
        console.log('[DEBUG] deleteRow called:', { rowId });
        if (wsServiceRef.current) {
            wsServiceRef.current.deleteRow(rowId);
        }
        else {
            console.error('[DEBUG] Cannot delete row - WebSocketService is not initialized');
        }
    }, []);
    // Column add function
    const addColumn = React.useCallback((columnId, name, cellType, referenceColumn) => {
        console.log('[DEBUG] addColumn called:', { columnId, name, cellType, referenceColumn });
        if (wsServiceRef.current) {
            wsServiceRef.current.addColumn(columnId, name, cellType, referenceColumn);
        }
        else {
            console.error('[DEBUG] Cannot add column - WebSocketService is not initialized');
        }
    }, []);
    // Column delete function
    const deleteColumn = React.useCallback((columnId) => {
        console.log('[DEBUG] deleteColumn called:', { columnId });
        if (wsServiceRef.current) {
            wsServiceRef.current.deleteColumn(columnId);
        }
        else {
            console.error('[DEBUG] Cannot delete column - WebSocketService is not initialized');
        }
    }, []);
    return {
        isConnected,
        state,
        error,
        updateCell,
        addRow,
        deleteRow,
        addColumn,
        deleteColumn
    };
};
exports.useGridSync = useGridSync;
