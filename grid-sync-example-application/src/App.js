import React, { useRef, useEffect, useState } from 'react';
import { GridSyncClient } from '@gridsync/grid-sdk';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  ClientSideRowModelModule, 
  ModuleRegistry
} from 'ag-grid-community';

// Register required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

function App() {
  const gridApiRef = useRef(null);
  const syncClientRef = useRef(null);
  const [rowData, setRowData] = useState(null);
  
  // Initial row data with IDs that match server data
  const initialRowData = [
    { id: 'row1', col1: '', col2: '', col3: '' },
    { id: 'row2', col1: '', col2: '', col3: '' },
    { id: 'row3', col1: '', col2: '', col3: '' }
  ];
  
  // Column definitions that match server data
  const columnDefs = [
    { field: 'id', headerName: 'ID', editable: false, hide: true },
    { field: 'col1', headerName: 'Column 1', editable: true },
    { field: 'col2', headerName: 'Column 2', editable: true },
    { field: 'col3', headerName: 'Column 3', editable: true }
  ];

  // Initialize GridSyncClient
  useEffect(() => {
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
        if (state && state.cells) {
          // Convert server state to AG Grid format
          const updatedRowData = initialRowData.map(row => {
            const rowId = row.id;
            const cellData = state.cells[rowId] || {};
            return {
              id: rowId,
              col1: cellData.col1?.value || '',
              col2: cellData.col2?.value || '',
              col3: cellData.col3?.value || ''
            };
          });
          setRowData(updatedRowData);
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      syncClientRef.current?.disconnect();
    };
  }, []);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    console.log('[DEBUG] AG Grid API initialized:', !!gridApiRef.current);
    
    // Connect the grid API to the sync client
    if (syncClientRef.current) {
      syncClientRef.current.connect(params.api);
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
        <h3>GridSync Thin Client Integration</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>This example demonstrates the thin client approach for integrating with AG Grid.</p>
          <p>Simply edit cells directly in the grid by double-clicking or pressing Enter on a cell. Changes will automatically sync with other connected clients.</p>
        </div>
      </div>
      
      {/* Grid */}
      <div className="ag-theme-alpine" style={{ height: 500, width: '90%', margin: '0 auto' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData || initialRowData}
          defaultColDef={{ 
            flex: 1,
            editable: true,
            sortable: true,
            filter: true
          }}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          modules={[ClientSideRowModelModule]}
          rowSelection="multiple"
          animateRows={true}
          getRowId={(params) => params.data.id}
          enableCellTextSelection={true}
          ensureDomOrder={true}
        />
      </div>
    </div>
  );
}

export default App;