"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgGridSync = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ag_grid_react_1 = require("ag-grid-react");
const useGridSync_1 = require("../../hooks/useGridSync");
/**
 * AgGridSync component for integrating AG Grid with GridSync
 */
const AgGridSync = ({ gridSyncConfig, modules, ...agGridProps }) => {
    // Get the grid sync hook
    const { isConnected, state, error, updateCell, addRow, deleteRow, addColumn, deleteColumn } = (0, useGridSync_1.useGridSync)(gridSyncConfig);
    // Reference to AG Grid API
    const gridApiRef = (0, react_1.useRef)(null);
    // Expose methods to parent component if onReady callback is provided
    (0, react_1.useEffect)(() => {
        if (gridSyncConfig.onReady) {
            gridSyncConfig.onReady({
                updateCell,
                addRow,
                deleteRow,
                addColumn,
                deleteColumn
            });
        }
    }, [updateCell, addRow, deleteRow, addColumn, deleteColumn, gridSyncConfig.onReady]);
    // Handle cell value changed
    const handleCellValueChanged = (0, react_1.useCallback)((event) => {
        if (event.newValue !== event.oldValue) {
            const rowId = event.node.id || event.node.data.id;
            const columnId = event.column.getColId();
            console.log('[DEBUG] Cell value changed:', { rowId, columnId, newValue: event.newValue, oldValue: event.oldValue });
            // Update cell in GridSync
            updateCell(rowId, columnId, event.newValue);
        }
    }, [updateCell]);
    // Apply state from server to grid
    (0, react_1.useEffect)(() => {
        console.log('[DEBUG] State received from server:', state);
        if (state && gridApiRef.current) {
            // Convert state to AG Grid format
            const rowData = convertStateToAgGridRows(state);
            console.log('[DEBUG] Converted row data for AG Grid:', rowData);
            try {
                // Check if gridApiRef.current is fully initialized
                if (!gridApiRef.current.applyTransaction) {
                    console.error('[DEBUG] Grid API applyTransaction method not available - possible module registration issue');
                    console.log('[DEBUG] Available API methods:', Object.keys(gridApiRef.current));
                    // Use setRowData as fallback if available
                    if (typeof gridApiRef.current.setRowData === 'function') {
                        console.log('[DEBUG] Falling back to setRowData API');
                        gridApiRef.current.setRowData(rowData);
                        return;
                    }
                    else {
                        console.error('[DEBUG] Critical error: No valid API method available to update data');
                        return;
                    }
                }
                console.log('[DEBUG] Attempting to update grid with transaction API');
                // Try to use the transaction API first
                const result = gridApiRef.current.applyTransaction({ update: rowData });
                console.log('[DEBUG] Transaction result:', result);
                // If no rows were updated, try adding them instead
                if (result && result.update && result.update.length === 0) {
                    console.log('[DEBUG] No rows updated, trying to add rows instead');
                    const addResult = gridApiRef.current.applyTransaction({ add: rowData });
                    console.log('[DEBUG] Add transaction result:', addResult);
                }
            }
            catch (e) {
                console.error('[DEBUG] Transaction API error:', e);
                // Fallback: if transaction API fails, try to use setRowData if available
                if (typeof gridApiRef.current.setRowData === 'function') {
                    console.log('[DEBUG] Falling back to setRowData API');
                    gridApiRef.current.setRowData(rowData);
                }
                else {
                    console.log('[DEBUG] Last resort: clear and add rows one by one');
                    // As a last resort, clear all data and then set it again using the API that's available
                    gridApiRef.current.setRowData([]);
                    rowData.forEach(row => {
                        try {
                            const addResult = gridApiRef.current?.applyTransaction({ add: [row] });
                            console.log('[DEBUG] Adding single row result:', addResult);
                        }
                        catch (addError) {
                            console.error('[DEBUG] Error adding row:', addError);
                        }
                    });
                }
            }
            // Debug column state
            if (gridApiRef.current.getColumnDefs) {
                console.log('[DEBUG] Grid columns state:', gridApiRef.current.getColumnDefs());
            }
        }
    }, [state]);
    // Handle grid ready event
    const onGridReady = (0, react_1.useCallback)((params) => {
        console.log('[DEBUG] Grid ready event fired');
        gridApiRef.current = params.api;
        console.log('[DEBUG] Grid API initialized:', !!gridApiRef.current);
        // Call original onGridReady if provided
        if (agGridProps.onGridReady) {
            agGridProps.onGridReady(params);
        }
    }, [agGridProps.onGridReady]);
    return ((0, jsx_runtime_1.jsx)(ag_grid_react_1.AgGridReact, { ...agGridProps, modules: modules, onGridReady: onGridReady, onCellValueChanged: handleCellValueChanged, getRowId: (params) => params.data.id || params.data.rowId }));
};
exports.AgGridSync = AgGridSync;
/**
 * Convert GridSync state to AG Grid row data format
 */
function convertStateToAgGridRows(state) {
    const { rows, columns, cells } = state;
    console.log('[DEBUG] Converting state:', {
        rowCount: rows.length,
        columnCount: columns.length,
        rowIds: rows,
        columnIds: columns
    });
    // Map each row to an object with column values
    return rows.map(rowId => {
        const rowData = {
            id: rowId, // ensure ID is present for getRowId
        };
        // Add cell values for each column
        columns.forEach(columnId => {
            if (cells[rowId] && cells[rowId][columnId]) {
                rowData[columnId] = cells[rowId][columnId].value;
            }
            else {
                rowData[columnId] = null; // Empty cell
            }
        });
        return rowData;
    });
}
