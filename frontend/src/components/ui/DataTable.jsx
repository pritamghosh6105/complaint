import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search,
  Filter
} from 'lucide-react';
import { Button } from './Button';
import EmptyState from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFields = [],
  pageSize = 10,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your query.',
  onRowClick,
  actions = null,
  className = '',
  style = {}
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        if (searchFields.length > 0) {
          return searchFields.some(f => String(item[f] || '').toLowerCase().includes(q));
        }
        return Object.values(item).some(val => 
          typeof val === 'string' && val.toLowerCase().includes(q)
        );
      });
    }

    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, search, searchFields, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className={`gov-card ${className}`} style={{ overflow: 'hidden', ...style }}>
      {/* Top Table Control Bar */}
      {(searchable || actions) && (
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {searchable ? (
            <div style={{
              position: 'relative',
              width: 'min(100%, 320px)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} 
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="form-input"
                style={{
                  paddingLeft: '36px',
                  fontSize: '0.85rem',
                  paddingTop: '8px',
                  paddingBottom: '8px'
                }}
              />
            </div>
          ) : <div />}

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table Body */}
      {paginatedData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} style={{ border: 'none', boxShadow: 'none' }} />
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                {columns.map(col => {
                  const isSortable = col.sortable !== false;
                  const isCurrentSort = sortKey === col.accessor;

                  return (
                    <th 
                      key={col.accessor || col.header}
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)',
                        cursor: isSortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => isSortable && handleSort(col.accessor)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{col.header}</span>
                        {isSortable && (
                          <span style={{ color: isCurrentSort ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                            {isCurrentSort ? (
                              sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                            ) : (
                              <ArrowUpDown size={12} opacity={0.5} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr 
                  key={row[keyField] || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {columns.map(col => (
                    <td 
                      key={col.accessor || col.header} 
                      style={{
                        padding: '13px 16px',
                        color: 'var(--text-primary)',
                        verticalAlign: 'middle',
                        whiteSpace: col.wrap ? 'normal' : 'nowrap'
                      }}
                    >
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              icon={<ChevronLeft size={14} />}
            >
              Previous
            </Button>
            <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              icon={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
