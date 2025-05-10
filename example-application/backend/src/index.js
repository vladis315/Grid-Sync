const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase } = require('./database');
const apiRoutes = require('./routes');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection for seeding
const dbPath = path.join(__dirname, '../data/grid_data.db');

/**
 * Seed the database with example data
 */
async function seedDatabase() {
  const db = new sqlite3.Database(dbPath);
  
  try {
    console.log('Starting database seeding...');
    
    const tenantId = 'tenant1';
    const documentId = 'doc1';
    const now = Date.now();
    
    // Check if document already exists
    const existingDoc = await getDocument(db, tenantId, documentId);
    if (existingDoc) {
      console.log('Example document already exists, skipping seeding');
      return; // Don't close the db here, let the finally block do it
    }
    
    // Insert document
    await runQuery(
      db,
      `INSERT OR REPLACE INTO documents (id, tenant_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [documentId, tenantId, 'Example Document', now, now]
    );
    
    console.log('Document created');
    
    // Define columns
    const columns = [
      { id: 'col1', name: 'Name', type: 'text', index: 0 },
      { id: 'col2', name: 'Age', type: 'number', index: 1 },
      { id: 'col3', name: 'Email', type: 'text', index: 2 },
      { id: 'col4', name: 'Active', type: 'boolean', index: 3 }
    ];
    
    // Insert columns
    for (const column of columns) {
      await runQuery(
        db,
        `INSERT OR REPLACE INTO columns 
         (id, document_id, tenant_id, name, column_index, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [column.id, documentId, tenantId, column.name, column.index, column.type, now, now]
      );
    }
    
    console.log('Columns created');
    
    // Define rows
    const rows = [
      { id: 'row1', index: 0 },
      { id: 'row2', index: 1 },
      { id: 'row3', index: 2 },
      { id: 'row4', index: 3 }
    ];
    
    // Insert rows
    for (const row of rows) {
      await runQuery(
        db,
        `INSERT OR REPLACE INTO rows
         (id, document_id, tenant_id, row_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, documentId, tenantId, row.index, now, now]
      );
    }
    
    console.log('Rows created');
    
    // Define cells data
    const cellsData = [
      // Row 1
      { rowId: 'row1', columnId: 'col1', value: 'John Doe', type: 'text' },
      { rowId: 'row1', columnId: 'col2', value: '30', type: 'number' },
      { rowId: 'row1', columnId: 'col3', value: 'john@example.com', type: 'text' },
      { rowId: 'row1', columnId: 'col4', value: 'true', type: 'boolean' },
      
      // Row 2
      { rowId: 'row2', columnId: 'col1', value: 'Jane Smith', type: 'text' },
      { rowId: 'row2', columnId: 'col2', value: '25', type: 'number' },
      { rowId: 'row2', columnId: 'col3', value: 'jane@example.com', type: 'text' },
      { rowId: 'row2', columnId: 'col4', value: 'true', type: 'boolean' },
      
      // Row 3
      { rowId: 'row3', columnId: 'col1', value: 'Bob Johnson', type: 'text' },
      { rowId: 'row3', columnId: 'col2', value: '45', type: 'number' },
      { rowId: 'row3', columnId: 'col3', value: 'bob@example.com', type: 'text' },
      { rowId: 'row3', columnId: 'col4', value: 'false', type: 'boolean' },
      
      // Row 4
      { rowId: 'row4', columnId: 'col1', value: 'Alice Brown', type: 'text' },
      { rowId: 'row4', columnId: 'col2', value: '22', type: 'number' },
      { rowId: 'row4', columnId: 'col3', value: 'alice@example.com', type: 'text' },
      { rowId: 'row4', columnId: 'col4', value: 'true', type: 'boolean' }
    ];
    
    // Insert cells
    for (const cell of cellsData) {
      const cellId = uuidv4();
      await runQuery(
        db,
        `INSERT OR REPLACE INTO cells
         (cell_id, row_id, column_id, document_id, tenant_id, value, type, timestamp, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cellId, cell.rowId, cell.columnId, documentId, tenantId, cell.value, cell.type, now, now, now]
      );
    }
    
    console.log('Cells created');
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
    });
  }
}

/**
 * Run a database query as a promise
 */
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

/**
 * Get document by tenant and id
 */
function getDocument(db, tenantId, documentId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM documents WHERE id = ? AND tenant_id = ?',
      [documentId, tenantId],
      (err, document) => {
        if (err) {
          reject(err);
        } else {
          resolve(document);
        }
      }
    );
  });
}

// Initialize database and then seed
initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    return seedDatabase();
  })
  .then(() => {
    console.log('Database ready');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// API routes
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 