# GridSync SDK

A thin real-time layer for AG Grid that enables collaborative editing and synchronization across multiple clients.

## Features

- **Real-Time Collaboration:** Synchronize grid data in real-time across multiple users
- **Multi-Tenant Support:** Built-in tenant isolation for SaaS applications
- **Simple Integration:** Works with existing AG Grid implementations
- **Lightweight:** Focused API that doesn't interfere with AG Grid features
- **Resilient:** Automatic reconnection and error handling

## Installation

```bash
npm install @gridsync/grid-sdk
# or
yarn add @gridsync/grid-sdk
```

## Quick Start

```typescript
import { GridSyncClient } from '@gridsync/grid-sdk';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function MyGrid() {
  const gridApiRef = useRef(null);
  const syncClientRef = useRef(null);
  const [rowData, setRowData] = useState(null);

  // Initialize GridSyncClient
  useEffect(() => {
    syncClientRef.current = new GridSyncClient({
      serverUrl: 'ws://your-server.com/realtime',
      apiKey: 'your-api-key',
      tenantId: 'tenant1',
      documentId: 'doc1',
      userId: 'user1',
      onReady: (client) => {
        console.log('GridSync client ready');
      },
      onError: (error) => {
        console.error('GridSync error:', error);
      },
      onStateChange: (state) => {
        // Update grid with server state
        setRowData(convertStateToRowData(state));
      }
    });
    
    return () => {
      syncClientRef.current?.disconnect();
    };
  }, []);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    // Connect the grid API to the sync client
    if (syncClientRef.current) {
      syncClientRef.current.connect(params.api);
    }
  };

  const onCellValueChanged = (params) => {
    if (!syncClientRef.current) return;
    
    const { data, colDef, newValue } = params;
    
    // Send update to server
    syncClientRef.current.updateCell({
      rowId: data.id,
      columnId: colDef.field,
      value: newValue
    });
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
}
```

## API Reference

### GridSyncClient

The main class for real-time synchronization.

#### Constructor

```typescript
new GridSyncClient(config: GridSyncConfig)
```

#### Configuration

| Property | Type | Description |
|----------|------|-------------|
| serverUrl | string | WebSocket server URL |
| apiKey | string | (Optional) API key for authentication |
| tenantId | string | (Optional) Tenant identifier |
| documentId | string | (Optional) Document identifier |
| userId | string | (Optional) User identifier |
| onReady | function | (Optional) Called when client is ready |
| onError | function | (Optional) Called on errors |
| onStateChange | function | (Optional) Called when state updates are received |

#### Methods

| Method | Description |
|--------|-------------|
| connect(gridApi) | Connect to an AG Grid API instance |
| updateCell(params) | Update a cell value on the server |
| disconnect() | Disconnect the client |
| isConnected() | Check if the client is connected |

## Server Requirements

This SDK works with the GridSync Server which provides:
- WebSocket endpoint for real-time communication
- Authentication and tenant management
- Persistence of grid state
- Conflict resolution

## License

MIT 