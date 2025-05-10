# GridSync Example Application

This is an example application demonstrating the integration of GridSync's thin client with AG Grid for real-time collaboration.

## About

This application showcases how to use the `@gridsync/grid-sdk` package to add real-time collaboration features to an AG Grid implementation. It demonstrates:

- Setting up the GridSyncClient
- Connecting it to AG Grid
- Handling cell value changes
- Processing state updates from the server

## Key Features

- Real-time synchronization of cell edits
- Multi-user collaboration
- Integration with standard AG Grid API
- Minimal wrapper code needed

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Access to a running GridSync Server instance

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the project root with:

```
REACT_APP_BACKEND_URL=ws://localhost:3000/realtime
REACT_APP_API_KEY=test-api-key-1
REACT_APP_TENANT_ID=tenant1
REACT_APP_DOCUMENT_ID=doc1
REACT_APP_USER_ID=user1
```

4. Start the development server:

```bash
npm start
```

## How It Works

This example uses a thin client approach that:

1. Creates a GridSyncClient instance in a React effect
2. Connects the client to the AG Grid API in the onGridReady callback
3. Sends cell updates to the server on cell value changes
4. Updates the grid when state changes are received from the server

## Code Structure

- `src/App.js` - Main application component with GridSync integration
- `public/` - Static assets

## Integration Example

```jsx
import { GridSyncClient } from '@gridsync/grid-sdk';
import { AgGridReact } from 'ag-grid-react';

// Initialize client
const syncClient = new GridSyncClient({
  serverUrl: 'ws://localhost:3000/realtime',
  // Other config...
});

// Connect to grid
function onGridReady(params) {
  syncClient.connect(params.api);
}

// Send updates to server
function onCellValueChanged(params) {
  syncClient.updateCell({
    rowId: params.data.id,
    columnId: params.colDef.field,
    value: params.newValue
  });
}

// Render grid
<AgGridReact
  onGridReady={onGridReady}
  onCellValueChanged={onCellValueChanged}
  // Other AG Grid props...
/>
```

## Additional Resources

- [GridSync SDK Documentation](../grid-sdk/README.md)
- [GridSync Server Documentation](../grid-sync-backend/README.md)
- [AG Grid Documentation](https://www.ag-grid.com/documentation/)
