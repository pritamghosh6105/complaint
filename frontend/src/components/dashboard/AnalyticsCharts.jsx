import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const CATEGORY_COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
];

const PRIORITY_COLOR_MAP = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontSize: '0.825rem'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label || payload[0].name}</div>
        <div style={{ color: 'var(--accent-cyan)' }}>
          Complaints: <strong>{payload[0].value}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ breakdownData, departmentData }) {
  const categoryData = breakdownData?.categoryData || [];
  const priorityData = breakdownData?.priorityData || [];
  const wardData = (breakdownData?.wardData || []).slice(0, 6);
  const departments = (departmentData || []).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="grid-cols-2">
        {/* Category Breakdown (Donut) */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '16px' }}>
            Complaints by Civic Category
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution (Bar) */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '16px' }}>
            ML Priority Distribution & Risk Levels
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={12} 
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`prio-${index}`} fill={PRIORITY_COLOR_MAP[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No priority data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Resolution Leaderboard */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '16px' }}>
          Department Workload & Resolution Performance
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>Department</th>
                <th style={{ padding: '10px 14px' }}>Department Head</th>
                <th style={{ padding: '10px 14px' }}>Total Assigned</th>
                <th style={{ padding: '10px 14px' }}>Resolved</th>
                <th style={{ padding: '10px 14px' }}>Resolution Rate</th>
                <th style={{ padding: '10px 14px' }}>SLA Breaches</th>
                <th style={{ padding: '10px 14px' }}>Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                    {d.name} <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>({d.code})</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.head_name || 'N/A'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{d.totalAssigned}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>{d.resolved}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.resolutionRate}%`, height: '100%', background: '#10b981' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.resolutionRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {d.slaBreaches > 0 ? (
                      <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>{d.slaBreaches} Breaches</span>
                    ) : (
                      <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>0 (100% On-time)</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#fbbf24', fontWeight: 700 }}>
                    ★ {d.satisfactionRating} / 5.0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
