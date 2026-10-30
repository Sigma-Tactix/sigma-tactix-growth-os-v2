import React from 'react';
import { cn } from '@/src/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Column content alignment; default left */
  align?: 'left' | 'right' | 'center';
  /** If set, the first column is replaced by a sortable header using this property */
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Enables client-side sorting; activeKey + activeDir control state from outside */
  sortableKeys?: string[];
  activeKey?: string | null;
  activeDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
  dense?: boolean;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Data table on the sigma material system. Plain-<table> under the hood so it
 * works with long content, sticky headers (add 'sticky top-0' in column
 * className), and horizontal scroll inside a `sigma-subpanel` wrapper.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortableKeys,
  activeKey,
  activeDir = 'asc',
  onSort,
  onRowClick,
  emptyState,
  className,
  dense = false,
}: DataTableProps<T>) {
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)]', className)}>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-[var(--sigma-border-strong)] bg-[var(--sigma-surface-subtle)]">
            {columns.map((col) => {
              const sortable = !!onSort && !!col.sortValue && !!sortableKeys?.includes(col.key);
              const isActive = activeKey === col.key;
              return (
                <th
                  key={col.key}
                  className={cn(
                    'sticky top-0 z-10 bg-[var(--sigma-surface-subtle)] font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--sigma-text-muted)]',
                    cellPad,
                    alignClass[col.align ?? 'left'],
                    sortable && 'cursor-pointer select-none hover:text-[var(--sigma-text)] transition-colors',
                    col.className
                  )}
                  onClick={sortable ? () => onSort?.(col.key) : undefined}
                  aria-sort={isActive ? (activeDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortable && (
                      <span className={cn('text-[9px]', isActive ? 'text-[var(--sigma-accent)]' : 'text-[var(--sigma-text-muted)]/40')}>
                        {isActive ? (activeDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                {emptyState ?? <span className="text-[var(--sigma-text-muted)]">No records</span>}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                className={cn(
                  'border-b border-[var(--sigma-border)] transition-colors last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-[var(--sigma-surface-subtle)]/70 focus-visible:outline-none focus-visible:bg-[var(--sigma-surface-subtle)]',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad,
                      'text-[var(--sigma-text-soft)]',
                      col.sortValue && col.key === activeKey && 'font-mono',
                      alignClass[col.align ?? 'left'],
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
