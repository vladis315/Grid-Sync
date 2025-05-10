const express = require('express');
const { 
  getDocument, 
  getRows, 
  getColumns, 
  getCells, 
  saveCell 
} = require('./database');

const router = express.Router();

/**
 * Get document data including rows, columns, and cells
 */
router.get('/documents/:tenantId/:documentId', async (req, res) => {
  try {
    const { tenantId, documentId } = req.params;
    
    const [document, rows, columns, cells] = await Promise.all([
      getDocument(tenantId, documentId),
      getRows(tenantId, documentId),
      getColumns(tenantId, documentId),
      getCells(tenantId, documentId)
    ]);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Reorganize cells by row and column
    const cellsByRowAndColumn = {};
    cells.forEach(cell => {
      if (!cellsByRowAndColumn[cell.row_id]) {
        cellsByRowAndColumn[cell.row_id] = {};
      }
      
      cellsByRowAndColumn[cell.row_id][cell.column_id] = {
        cellId: cell.cell_id,
        value: cell.value,
        name: cell.name,
        type: cell.type,
        timestamp: cell.timestamp
      };
    });
    
    // Convert row IDs and column IDs to arrays
    const rowIds = rows.map(row => row.id);
    const columnIds = columns.map(column => column.id);
    
    res.json({
      document,
      state: {
        rows: rowIds,
        columns: columnIds,
        cells: cellsByRowAndColumn
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Failed to fetch document data' });
  }
});

/**
 * Update a cell
 */
router.post('/cells', async (req, res) => {
  try {
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
    } = req.body;
    
    if (!rowId || !columnId || !documentId || !tenantId || timestamp === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await saveCell({
      cellId: cellId || `${rowId}_${columnId}_${Date.now()}`,
      rowId,
      columnId,
      documentId,
      tenantId,
      value,
      name,
      type,
      timestamp
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving cell:', error);
    res.status(500).json({ message: 'Failed to save cell data' });
  }
});

module.exports = router; 