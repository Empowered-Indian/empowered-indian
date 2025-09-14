import * as React from 'react';
import { useMemo, useState } from 'react';
import './StateCardList.css';
import { formatINRCompact } from '../../../../utils/formatters';
import { useNavigate } from "react-router-dom";

const StateCardList = ({ states = [] }) => {
  const clonedStates = structuredClone(states || []);
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({ key: 'state', direction: 'asc' });

  const columns = [
    { key: 'id', label: 'ID', width: '60px', align: 'center' },
    { key: 'state', label: 'State / UT', width: '40%', align: 'left' },
    { key: 'mpCount', label: 'MPs', width: '80px', align: 'center' },
    { key: 'totalAllocated', label: 'Total Allocated', width: '140px', align: 'center' },
    { key: 'totalExpenditure', label: 'Total Expenditure', width: '140px', align: 'center' },
    { key: 'utilizationPercentage', label: 'Fund Utilization', width: '160px', align: 'center' },
    { key: 'totalWorksCompleted', label: 'Works Completed', width: '140px', align: 'center' },
    { key: 'recommendedWorksCount', label: 'Works Recommended', width: '160px', align: 'center' },
  ];

  const normalizeRow = (s /*, index*/) => ({
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

    return sorted;
  }, [clonedStates, sortConfig]);

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

  return (
    <div className="state-table-container" role="region" aria-label="States table">
      <div className="state-table">
        <div className="table-header-row">
          {columns.map(col => (
            <div
              key={col.key}
              className={`table-header-cell ${sortConfig.key === col.key ? 'sorted' : ''}`}
              style={{ width: col.width, textAlign: col.align }}
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
              <div className="table-cell" style={{ width: columns[0].width, textAlign: columns[0].align }}>{row.id}</div>
              <div className="table-cell state-name" style={{ width: columns[1].width, textAlign: columns[1].align }}>
                <div className="state-title">{row.state}</div>
              </div>
              <div className="table-cell" style={{ width: columns[2].width, textAlign: columns[2].align }}>{row.mpCount}</div>
              <div className="table-cell" style={{ width: columns[3].width, textAlign: columns[3].align }}>{row.totalAllocated != null ? formatINRCompact(row.totalAllocated) : '—'}</div>
              <div className="table-cell" style={{ width: columns[4].width, textAlign: columns[4].align }}>{row.totalExpenditure != null ? formatINRCompact(row.totalExpenditure) : '—'}</div>
              <div className="table-cell utilization-cell" style={{ width: columns[5].width, textAlign: columns[5].align }}>
                {(() => {
                  const utilClass = row.utilizationPercentage >= 75
                    ? 'utilization-high'
                    : row.utilizationPercentage >= 40
                      ? 'utilization-medium'
                      : 'utilization-low';
                  return (
                    <>
                      <div className={`utilization-label ${utilClass}`}>{row.utilizationPercentage.toFixed(1)}%</div>
                      <div className="utilization-bar-outer" aria-hidden>
                        <div
                          className={`utilization-bar ${utilClass}`}
                          style={{ width: `${row.utilizationPercentage}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="table-cell" style={{ width: columns[6].width, textAlign: columns[6].align }}>{row.totalWorksCompleted}</div>
              <div className="table-cell" style={{ width: columns[7].width, textAlign: columns[7].align }}>{row.recommendedWorksCount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StateCardList;
