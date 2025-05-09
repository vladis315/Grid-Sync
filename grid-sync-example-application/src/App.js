import React, { useState, useRef } from 'react';
import { AgGridSync } from '@gridsync/grid-sdk';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { v4 as uuidv4 } from 'uuid';

// No need to register modules explicitly in AG Grid v33.x
// ModuleRegistry was removed/changed in newer versions

function App() {
  const [rowIds, setRowIds] = useState([]);
  const gridRef = useRef(null);
  
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
  
  // Handler functions for UI buttons
  const handleAddRow = () => {
    if (gridRef.current) {
      const rowId = uuidv4();
      gridRef.current.addRow(rowId);
      setRowIds(prev => [...prev, rowId]);
    }
  };
  
  const handleAddColumn = () => {
    if (gridRef.current) {
      const columnId = prompt('Enter column ID', 'newColumn');
      const columnName = prompt('Enter column name', 'New Column');
      if (columnId && columnName) {
        gridRef.current.addColumn(columnId, columnName);
      }
    }
  };
  
  const handleAddCellData = () => {
    if (gridRef.current && rowIds.length > 0) {
      const rowId = rowIds[0]; // Use the first row for simplicity
      const columnId = prompt('Enter column ID', 'name');
      const value = prompt('Enter cell value', 'Test Value');
      
      if (columnId && value) {
        gridRef.current.updateCell(rowId, columnId, value);
      }
    } else {
      alert('Add a row first!');
    }
  };

  return (
    <div className="App">
      <h1>GridSync Test</h1>
      
      {/* Control Panel */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Grid Controls</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleAddRow}
            style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Row
          </button>
          <button 
            onClick={handleAddColumn}
            style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Column
          </button>
          <button 
            onClick={handleAddCellData}
            style={{ padding: '8px 16px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Cell Data
          </button>
        </div>
      </div>
      
      {/* Grid */}
      <div className="ag-theme-alpine" style={{ height: 500, width: '90%', margin: '0 auto' }}>
        <AgGridSync
          gridSyncConfig={gridSyncConfig}
          columnDefs={columnDefs}
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