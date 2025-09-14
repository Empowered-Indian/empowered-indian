import * as React from 'react';
import { useMemo, useState } from 'react';
import './StateCardList.css';
import { formatINRCompact } from '../../../../utils/formatters';
import { useNavigate } from "react-router-dom";

const StateCardList = ({ states = [], onSortedStatesChange }) => {
  const clonedStates = states;
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({ key: 'state', direction: 'asc' });

  const columns = [
    { key: 'id', label: 'ID', width: '3%', minWidth: 40, align: 'center' },
    { key: 'state', label: 'State / UT', width: '35%', minWidth: 160, align: 'left' },
    { key: 'mpCount', label: 'MPs', width: '10%', minWidth: 70, align: 'center' },
    { key: 'totalAllocated', label: 'Total Allocated', width: '10%', minWidth: 120, align: 'center' },
    { key: 'totalExpenditure', label: 'Total Expenditure', width: '10%', minWidth: 120, align: 'center' },
    { key: 'utilizationPercentage', label: 'Fund Utilization', width: '10%', minWidth: 130, align: 'center' },
    { key: 'totalWorksCompleted', label: 'Works Completed', width: '10%', minWidth: 130, align: 'center' },
    { key: 'recommendedWorksCount', label: 'Works Recommended', width: '10%', minWidth: 150, align: 'center' },
  ];

  const normalizeRow = (s) => ({
    state: s.state || 'Unknown',
    mpCount: s.mpCount || 0,
    totalAllocated: s.totalAllocated ?? null,
    totalExpenditure: s.totalExpenditure ?? null,
    utilizationPercentage: s.utilizationPercentage ?? 0,
    totalWorksCompleted: s.totalWorksCompleted || 0,
    recommendedWorksCount: s.recommendedWorksCount || 0,
    raw: s
  });

  const rows = useMemo(() => {
    const mapped = clonedStates.map((s, i) => ({ ...normalizeRow(s), __origIndex: i }));

    const baseOrder = [...mapped].sort((a, b) => {
      const sa = (a.state || '').toString();
      const sb = (b.state || '').toString();
      return sa.localeCompare(sb);
    });
    const origToBaseId = new Map();
    baseOrder.forEach((r, i) => origToBaseId.set(r.__origIndex, i + 1));
    const withBaseIds = mapped.map(r => ({ ...r, id: origToBaseId.get(r.__origIndex) || 0 }));

    const { key, direction } = sortConfig;
    const sortKey = key === 'id' ? 'id' : key;

    const sorted = [...withBaseIds].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') {
        return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (typeof va === 'number') {
        return direction === 'asc' ? va - vb : vb - va;
      }
      return 0;
    });

    if (onSortedStatesChange && typeof onSortedStatesChange === 'function') {
      const sortedStatesData = sorted.map(row => row.raw);
      onSortedStatesChange(sortedStatesData);
    }

    return sorted;
  }, [clonedStates, sortConfig, onSortedStatesChange]);

  const requestSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const onRowActivate = (row) => {
    const stateSlug = row.state.toLowerCase().replace(/\s+/g, '-');
    navigate(`/mplads/states/${stateSlug}`);
  };

  const getUtilizationClass = (percentage) => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className="state-table-container" role="region" aria-label="States table">
      <div className="state-table">
        <div className="table-header-row">
          {columns.map(col => (
            <div
              key={col.key}
              className={`table-header-cell ${sortConfig.key === col.key ? 'sorted' : ''} align-${col.align}`}
               style={{ width: col.width, textAlign: col.align, minWidth: col.minWidth }}
               role="columnheader"
               tabIndex={0}
               onClick={() => requestSort(col.key)}
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') requestSort(col.key); }}
               aria-sort={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <span>{col.label}</span>
              <span className="sort-indicator">{sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇵'}</span>
            </div>
          ))}
        </div>

        <div className="table-body">
          {rows.length === 0 && (
            <div className="no-data">No states available</div>
          )}
          {rows.map(row => (
            <div
              key={row.id}
              className="table-row"
              role="button"
              tabIndex={0}
              onClick={() => onRowActivate(row)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRowActivate(row); }}
              aria-label={`Open details for ${row.state}`}
            >
              <div className={`table-cell align-${columns[0].align}`} data-label={columns[0].label} style={{ width: columns[0].width, minWidth: columns[0].minWidth }}>{row.id}</div>
              <div className={`table-cell state-name align-${columns[1].align}`} data-label={columns[1].label} style={{ width: columns[1].width, minWidth: columns[1].minWidth, overflow: 'wrap' }}>
                <div className="state-title">{row.state}</div>
              </div>
              <div className={`table-cell align-${columns[2].align}`} data-label={columns[2].label} style={{ width: columns[2].width, minWidth: columns[2].minWidth }}>{row.mpCount}</div>
              <div className={`table-cell align-${columns[3].align}`} data-label={columns[3].label} style={{ width: columns[3].width, minWidth: columns[3].minWidth }}>{row.totalAllocated != null ? formatINRCompact(row.totalAllocated) : '—'}</div>
              <div className={`table-cell align-${columns[4].align}`} data-label={columns[4].label} style={{ width: columns[4].width, minWidth: columns[4].minWidth }}>{row.totalExpenditure != null ? formatINRCompact(row.totalExpenditure) : '—'}</div>
               <div className="table-cell utilization-cell" data-label={columns[5].label} style={{ width: columns[5].width, textAlign: columns[5].align, minWidth: columns[5].minWidth }}>
                 {(() => {
                   const utilClass = row.utilizationPercentage >= 80
                     ? 'utilization-high'
                     : row.utilizationPercentage >= 50
                       ? 'utilization-medium'
                       : 'utilization-low';
                   return (
                     <>
                       <div className={`utilization-label ${utilClass}`}>{row.utilizationPercentage.toFixed(1)}%</div>
                       <div className="utilization-bar">
                         <div
                           className={`utilization-fill utilization-${getUtilizationClass(row.utilizationPercentage)}`}
                           style={{ width: `${row.utilizationPercentage}%` }}
                         />
                       </div>
                     </>
                   );
                 })()}
               </div>
              <div className={`table-cell align-${columns[6].align}`} data-label={columns[6].label} style={{ width: columns[6].width, minWidth: columns[6].minWidth }}>{row.totalWorksCompleted}</div>
              <div className={`table-cell align-${columns[7].align}`} data-label={columns[7].label} style={{ width: columns[7].width, minWidth: columns[7].minWidth }}>{row.recommendedWorksCount}</div>
             </div>
           ))}
         </div>
       </div>
     </div>
   );
 };
 
 export default StateCardList;
