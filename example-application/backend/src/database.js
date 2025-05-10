const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../data/grid_data.db');
const db = new sqlite3.Database(dbPath);

/**
 * Initialize the database schema
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          name TEXT,
          created_at INTEGER,
          updated_at INTEGER
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS rows (
          id TEXT NOT NULL,
          document_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          row_index INTEGER,
          created_at INTEGER,
          updated_at INTEGER,
          PRIMARY KEY (id, document_id, tenant_id),
          FOREIGN KEY (document_id, tenant_id) REFERENCES documents(id, tenant_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS columns (
          id TEXT NOT NULL,
          document_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          name TEXT,
          column_index INTEGER,
          type TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          PRIMARY KEY (id, document_id, tenant_id),
          FOREIGN KEY (document_id, tenant_id) REFERENCES documents(id, tenant_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS cells (
          cell_id TEXT PRIMARY KEY,
          row_id TEXT NOT NULL,
          column_id TEXT NOT NULL,
          document_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          value TEXT,
          name TEXT,
          type TEXT,
          timestamp INTEGER,
          created_at INTEGER,
          updated_at INTEGER,
          FOREIGN KEY (row_id, document_id, tenant_id) REFERENCES rows(id, document_id, tenant_id),
          FOREIGN KEY (column_id, document_id, tenant_id) REFERENCES columns(id, document_id, tenant_id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Get document data
 */
function getDocument(tenantId, documentId) {
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

/**
 * Get all rows for a document
 */
function getRows(tenantId, documentId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM rows WHERE document_id = ? AND tenant_id = ? ORDER BY row_index',
      [documentId, tenantId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

/**
 * Get all columns for a document
 */
function getColumns(tenantId, documentId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM columns WHERE document_id = ? AND tenant_id = ? ORDER BY column_index',
      [documentId, tenantId],
      (err, columns) => {
        if (err) {
          reject(err);
        } else {
          resolve(columns);
        }
      }
    );
  });
}

/**
 * Get all cells for a document
 */
function getCells(tenantId, documentId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM cells WHERE document_id = ? AND tenant_id = ?',
      [documentId, tenantId],
      (err, cells) => {
        if (err) {
          reject(err);
        } else {
          resolve(cells);
        }
      }
    );
  });
}

/**
 * Save cell data
 */
function saveCell(cellData) {
  const {
    cellId,
    rowId,
    columnId,
    documentId,
    tenantId,
    value,
    name,
    type,
    timestamp
  } = cellData;

  const now = Date.now();

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO cells 
       (cell_id, row_id, column_id, document_id, tenant_id, value, name, type, timestamp, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(cell_id) DO UPDATE SET
         value = excluded.value,
         name = excluded.name,
         type = excluded.type,
         timestamp = excluded.timestamp,
         updated_at = excluded.updated_at`,
      [cellId, rowId, columnId, documentId, tenantId, value, name, type, timestamp, now, now],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
}

module.exports = {
  db,
  initDatabase,
  getDocument,
  getRows,
  getColumns,
  getCells,
  saveCell
}; 