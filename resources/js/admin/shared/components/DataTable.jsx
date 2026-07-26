import React from 'react';

export function DataTable({ columns, rows, emptyMsg }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} style={{
                                padding: '0.75rem 1.25rem', textAlign: 'left',
                                fontSize: '0.75rem', fontWeight: 700, color: '#6b7280',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                whiteSpace: 'nowrap',
                            }}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563', fontSize: '0.875rem' }}>
                                {emptyMsg || 'No data.'}
                            </td>
                        </tr>
                    ) : rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: '0.875rem 1.25rem', verticalAlign: 'middle' }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
