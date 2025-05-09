import React, { useRef } from 'react';
import { AgGridSync } from '@gridsync/grid-sdk';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ClientSideRowModelModule } from 'ag-grid-community';

// No need to register modules explicitly in AG Grid v33.x
// ModuleRegistry was removed/changed in newer versions

function App() {
  const gridRef = useRef(null);
  
  // Initial row data - rows must be pre-defined since we removed row-adding functionality
  const initialRowData = [
    { id: 'row1', name: '', age: '', country: '' },
    { id: 'row2', name: '', age: '', country: '' },
    { id: 'row3', name: '', age: '', country: '' }
  ];
  
  // Column definitions
  const columnDefs = [
    { field: 'name', headerName: 'Name', editable: true },
    { field: 'age', headerName: 'Age', editable: true },
    { field: 'country', headerName: 'Country', editable: true }
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
    }
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
          rowData={initialRowData}
          defaultColDef={{ flex: 1 }}
          theme="legacy"
          rowModelType="clientSide"
          modules={[ClientSideRowModelModule]}
        />
      </div>
    </div>
  );
}

export default App;