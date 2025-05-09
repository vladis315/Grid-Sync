# GridSync SDK

This is the React SDK for integrating with the GridSync real-time collaboration backend. It provides components and hooks for easily adding real-time collaboration to various grid components.

## Features

- Ready-to-use components for popular grid libraries (AG Grid, etc.)
- WebSocket connection management
- Real-time data synchronization

## Installation

```bash
npm install @gridsync/grid-sdk
```

Or using the local package:

```bash
npm install file:/path/to/grid-sync-sdk
```

## Usage

```tsx
import { AgGridSync } from '@gridsync/grid-sdk';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const App = () => {
  // AG Grid configuration
  const columnDefs = [
    { field: 'name' },
    { field: 'age', editable: true },
    { field: 'country', editable: true }
  ];

  // GridSync configuration
  const gridSyncConfig = {
    serverUrl: 'ws://localhost:3000/realtime',
    apiKey: 'test-api-key-1',
    tenantId: 'tenant1',
    documentId: 'doc1',
    userId: 'user1'
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridSync
        gridSyncConfig={gridSyncConfig}
        columnDefs={columnDefs}
        rowData={[]}
      />
    </div>
  );
};
```

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Watch for changes
npm run dev
```

## License

MIT 