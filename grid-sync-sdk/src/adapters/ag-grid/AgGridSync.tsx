import React, { useCallback, useEffect, useRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { CellValueChangedEvent, GridApi, RowNode } from 'ag-grid-community';
import { v4 as uuidv4 } from 'uuid';
import { useGridSync } from '../../hooks/useGridSync';
import { AgGridSyncProps, MessageType, DocumentState } from '../../types';

/**
 * AgGridSync component for integrating AG Grid with GridSync
 */
export const AgGridSync: React.FC<AgGridSyncProps> = ({
  gridSyncConfig,
  modules,
  ...agGridProps
}) => {
  // Get the grid sync hook
  const { isConnected, state, error, updateCell } = useGridSync(gridSyncConfig);
  
  // Reference to AG Grid API
  const gridApiRef = useRef<GridApi | null>(null);
  
  // Expose methods to parent component if onReady callback is provided
  useEffect(() => {
    if (gridSyncConfig.onReady) {
      gridSyncConfig.onReady({
        updateCell
      });
    }
  }, [updateCell, gridSyncConfig.onReady]);
  
  // Handle cell value changed
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (event.newValue !== event.oldValue) {
      const rowId = event.node.id || event.node.data.id;
      const columnId = event.column.getColId();
      
      console.log('[DEBUG] Cell value changed:', { rowId, columnId, newValue: event.newValue, oldValue: event.oldValue });
      
      // Update cell in GridSync
      updateCell(rowId, columnId, event.newValue);
    }
  }, [updateCell]);
  
  // Apply state from server to grid
  useEffect(() => {
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
          } else {
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
      } catch (e) {
        console.error('[DEBUG] Transaction API error:', e);
        // Fallback: if transaction API fails, try to use setRowData if available
        if (typeof gridApiRef.current.setRowData === 'function') {
          console.log('[DEBUG] Falling back to setRowData API');
          gridApiRef.current.setRowData(rowData);
        } else {
          console.log('[DEBUG] Last resort: clear and add rows one by one');
          // As a last resort, clear all data and then set it again using the API that's available
          gridApiRef.current.setRowData([]);
          rowData.forEach(row => {
            try {
              const addResult = gridApiRef.current?.applyTransaction({ add: [row] });
              console.log('[DEBUG] Adding single row result:', addResult);
            } catch (addError) {
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
  const onGridReady = useCallback((params: any) => {
    console.log('[DEBUG] Grid ready event fired');
    gridApiRef.current = params.api;
    console.log('[DEBUG] Grid API initialized:', !!gridApiRef.current);
    
    // Call original onGridReady if provided
    if (agGridProps.onGridReady) {
      agGridProps.onGridReady(params);
    }
  }, [agGridProps.onGridReady]);
  
  return (
    <AgGridReact
      {...agGridProps}
      modules={modules}
      onGridReady={onGridReady}
      onCellValueChanged={handleCellValueChanged}
      getRowId={(params) => params.data.id || params.data.rowId}
    />
  );
};

/**
 * Convert GridSync state to AG Grid row data format
 */
function convertStateToAgGridRows(state: DocumentState): any[] {
  const { rows, columns, cells } = state;
  
  console.log('[DEBUG] Converting state:', { 
    rowCount: rows.length, 
    columnCount: columns.length, 
    rowIds: rows,
    columnIds: columns
  });
  
  // Map each row to an object with column values
  return rows.map(rowId => {
    const rowData: Record<string, any> = {
      id: rowId, // ensure ID is present for getRowId
    };
    
    // Add cell values for each column
    columns.forEach(columnId => {
      if (cells[rowId] && cells[rowId][columnId]) {
        rowData[columnId] = cells[rowId][columnId].value;
      } else {
        rowData[columnId] = null; // Empty cell
      }
    });
    
    return rowData;
  });
} 