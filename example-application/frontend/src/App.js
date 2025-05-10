import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GridSyncClient } from '@gridsync/grid-sdk';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  ClientSideRowModelModule,
  ModuleRegistry 
} from 'ag-grid-community';

// Register required modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule
]);

function App() {
  const gridRef = useRef(null);
  const syncClientRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Column definitions
  const [columnDefs] = useState([
    { field: 'id', headerName: 'ID', editable: false },
    { field: 'col1', headerName: 'Name', editable: true },
    { field: 'col2', headerName: 'Age', editable: true },
    { field: 'col3', headerName: 'Email', editable: true },
    { field: 'col4', headerName: 'Active', editable: true }
  ]);

  // Default column definition
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    editable: true,
    resizable: true
  };

  // Memoize this to prevent unnecessary re-renders
  const getRowId = useCallback((params) => {
    return params.data.id;
  }, []);

  // Initialize GridSyncClient - only once
  useEffect(() => {
    // Only create the client if it doesn't exist
    if (!syncClientRef.current) {
      syncClientRef.current = new GridSyncClient({
        serverUrl: process.env.REACT_APP_BACKEND_URL || 'ws://localhost:3000/realtime',
        apiKey: process.env.REACT_APP_API_KEY || 'test-api-key-1',
        tenantId: process.env.REACT_APP_TENANT_ID || 'tenant1',
        documentId: process.env.REACT_APP_DOCUMENT_ID || 'doc1',
        userId: process.env.REACT_APP_USER_ID || 'user1',
        onReady: (client) => {
          console.log('[DEBUG] GridSync client ready');
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('[ERROR] GridSync error:', error);
          setIsLoading(false);
        },
        onStateChange: (state) => {
          console.log('[DEBUG] State received:', state);
          
          // Don't update state if the user is editing
          const gridApi = gridRef.current;
          if (gridApi) {
            try {
              const editingCells = gridApi.getEditingCells();
              if (editingCells && editingCells.length > 0) {
                console.log('[DEBUG] Ignoring state update during editing');
                return;
              }
            } catch (error) {
              console.warn('[WARN] Error checking editing cells:', error);
              // Continue with state update even if we couldn't check editing status
            }
          }
          
          if (state && state.cells) {
            // Transform the state data into AG Grid format
            const newRowData = [];
            
            if (state.rows && Array.isArray(state.rows) && state.rows.length > 0) {
              state.rows.forEach(rowId => {
                if (!rowId) return; // Skip if rowId is null or undefined
                
                const rowData = { id: rowId };
                
                if (state.cells[rowId]) {
                  Object.entries(state.cells[rowId]).forEach(([colId, cellData]) => {
                    if (cellData && cellData.value !== undefined) {
                      rowData[colId] = cellData.value;
                    } else {
                      rowData[colId] = ''; // Default to empty string for undefined values
                    }
                  });
                }
                
                newRowData.push(rowData);
              });
            }
            
            if (newRowData.length === 0) {
              // Fallback to placeholder data if no data was processed
              newRowData.push(
                { id: 'row1', col1: '', col2: '', col3: '' },
                { id: 'row2', col1: '', col2: '', col3: '' },
                { id: 'row3', col1: '', col2: '', col3: '' }
              );
              console.log('[DEBUG] Using placeholder data - no valid rows found in state');
            } else {
              console.log('[DEBUG] Processed', newRowData.length, 'rows from state');
            }
            
            setRowData(newRowData);
          }
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      if (syncClientRef.current) {
        syncClientRef.current.disconnect();
        syncClientRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  const onGridReady = (params) => {
    const { api } = params;
    gridRef.current = api;
    
    // Connect the grid API to the sync client
    if (syncClientRef.current) {
      syncClientRef.current.connect(api);
    }
  };

  const onCellValueChanged = (params) => {
    if (!syncClientRef.current) return;
    
    const { data, colDef, newValue } = params;
    const rowId = data.id;
    const columnId = colDef.field;
    
    // Skip if it's the id field
    if (columnId === 'id') return;
    
    console.log(`[DEBUG] Cell value changed: ${rowId}/${columnId} = ${newValue}`);
    
    // Use the GridSyncClient to update the cell value
    syncClientRef.current.updateCell({
      rowId: rowId,
      columnId: columnId,
      value: newValue
    });
  };

  return (
    <div className="App">
      <h1>GridSync Test</h1>
      
      {/* Info Panel */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>GridSync Client Integration</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>This example demonstrates real-time collaborative editing with Redis and database persistence.</p>
          <p>Simply edit cells directly in the grid by double-clicking or pressing Enter on a cell. Changes automatically sync with all clients.</p>
        </div>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <p>Loading data from server...</p>
        </div>
      )}
      
      {/* Grid */}
      <div className="ag-theme-alpine" style={{ height: 500, width: '90%', margin: '0 auto' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          getRowId={getRowId}
          stopEditingWhenCellsLoseFocus={true}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
        />
      </div>
    </div>
  );
}

export default App;