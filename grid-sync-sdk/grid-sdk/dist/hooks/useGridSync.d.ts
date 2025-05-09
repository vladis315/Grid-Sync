import { GridSyncConfig, DocumentState } from '../types';
/**
 * Hook for using GridSync in React components
 */
export declare const useGridSync: (config: GridSyncConfig) => {
    isConnected: boolean;
    state: DocumentState | null;
    error: string | null;
    updateCell: (rowId: string, columnId: string, value: any, name?: string, cellType?: string) => void;
    addRow: (rowId?: string, referenceRow?: string) => void;
    deleteRow: (rowId: string) => void;
    addColumn: (columnId: string, name: string, cellType?: string, referenceColumn?: string) => void;
    deleteColumn: (columnId: string) => void;
};
