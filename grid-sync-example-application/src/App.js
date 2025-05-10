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
  const [rowData, setRowData] = useState([
    { id: 'row1', col1: 'Test Cell 1-1', col2: 'Test Cell 1-2', col3: 'Test Cell 1-3' },
    { id: 'row2', col1: 'Test Cell 2-1', col2: 'Test Cell 2-2', col3: 'Test Cell 2-3' },
    { id: 'row3', col1: 'Test Cell 3-1', col2: 'Test Cell 3-2', col3: 'Test Cell 3-3' }
  ]);
  
  // Column definitions that match server data
  const [columnDefs] = useState([
    { field: 'id', headerName: 'ID', editable: false },
    { field: 'col1', headerName: 'Column 1', editable: true },
    { field: 'col2', headerName: 'Column 2', editable: true },
    { field: 'col3', headerName: 'Column 3', editable: true }
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
        },
        onError: (error) => {
          console.error('[ERROR] GridSync error:', error);
        },
        onStateChange: (state) => {
          console.log('[DEBUG] State received:', state);
          
          // Don't update state if the user is editing
          const gridApi = gridRef.current;
          if (gridApi && gridApi.getEditingCells().length > 0) {
            console.log('[DEBUG] Ignoring state update during editing');
            return;
          }
          
          if (state && state.cells) {
            setRowData(prevRowData => {
              // Deep clone to avoid mutation
              const newRowData = JSON.parse(JSON.stringify(prevRowData));
              
              // Update cell data from server state
              Object.entries(state.cells).forEach(([rowId, rowCells]) => {
                const rowIndex = newRowData.findIndex(r => r.id === rowId);
                if (rowIndex >= 0) {
                  // Update cell values
                  Object.entries(rowCells).forEach(([colId, cellData]) => {
                    if (cellData && cellData.value !== undefined) {
                      newRowData[rowIndex][colId] = cellData.value;
                    }
                  });
                }
              });
              
              return newRowData;
            });
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

  // Function to manually update a cell
  const updateFirstRow = () => {
    const newValue = 'Manual update ' + Date.now().toString().slice(-4);
    
    // Update local state first
    setRowData(prevData => {
      const newData = [...prevData];
      if (newData.length > 0) {
        newData[0] = { ...newData[0], col1: newValue };
      }
      return newData;
    });
    
    // Then send update to server
    if (syncClientRef.current) {
      syncClientRef.current.updateCell({
        rowId: 'row1',
        columnId: 'col1',
        value: newValue
      });
    }
  };

  return (
    <div className="App">
      <h1>GridSync Test</h1>
      
      {/* Info Panel */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>GridSync Thin Client Integration</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>This example demonstrates the thin client approach for integrating with AG Grid.</p>
          <p>Simply edit cells directly in the grid by double-clicking or pressing Enter on a cell. Changes will automatically sync with other connected clients.</p>
        </div>
        <div>
          <button onClick={updateFirstRow}>Update First Row</button>
        </div>
      </div>
      
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
          stopEditingWhenCellsLoseFocus={false}
          enterMovesDown={false}
          enterMovesDownAfterEdit={false}
        />
      </div>
    </div>
  );
}

export default App;