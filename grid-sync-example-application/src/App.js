import React, { useRef, useEffect, useState } from 'react';
import { AgGridSync } from '@gridsync/grid-sdk';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  ClientSideRowModelModule, 
  ModuleRegistry,
  GridApi
} from 'ag-grid-community';

// Register required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

function App() {
  const gridRef = useRef(null);
  const gridApiRef = useRef(null);
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

  // GridSync configuration using environment variables
  const gridSyncConfig = {
    serverUrl: process.env.REACT_APP_BACKEND_URL || 'ws://localhost:3000/realtime',
    apiKey: process.env.REACT_APP_API_KEY || 'test-api-key-1',
    tenantId: process.env.REACT_APP_TENANT_ID || 'tenant1',
    documentId: process.env.REACT_APP_DOCUMENT_ID || 'doc1',
    userId: process.env.REACT_APP_USER_ID || 'user1',
    onReady: (api) => {
      // Store the grid api for later use
      gridRef.current = api;
      console.log('[DEBUG] Grid API ready:', api);
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
  };

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    console.log('[DEBUG] AG Grid API initialized:', !!gridApiRef.current);
  };

  return (
    <div className="App">
      <h1>GridSync Test</h1>
      
      {/* Info Panel */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>GridSync Cell-Value-Only Mode</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>This version only supports cell value syncing. Row and column structure must be pre-defined.</p>
          <p>Simply edit cells directly in the grid by double-clicking or pressing Enter on a cell. Changes will automatically sync with other connected clients.</p>
        </div>
      </div>
      
      {/* Grid */}
      <div className="ag-theme-alpine" style={{ height: 500, width: '90%', margin: '0 auto' }}>
        <AgGridSync
          gridSyncConfig={gridSyncConfig}
          columnDefs={columnDefs}
          rowData={rowData || initialRowData}
          defaultColDef={{ 
            flex: 1,
            editable: true,
            sortable: true,
            filter: true
          }}
          onGridReady={onGridReady}
          modules={[ClientSideRowModelModule]}
          rowSelection="multiple"
          animateRows={true}
          getRowId={(params) => params.data.id}
        />
      </div>
    </div>
  );
}

export default App;