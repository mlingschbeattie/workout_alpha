import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '../lib/api';

const ResponsiveContainer = dynamic(() => import('recharts').then(m=>m.ResponsiveContainer), { ssr:false });
const LineChart = dynamic(() => import('recharts').then(m=>m.LineChart), { ssr:false });
const Line = dynamic(() => import('recharts').then(m=>m.Line), { ssr:false });
const BarChart = dynamic(() => import('recharts').then(m=>m.BarChart), { ssr:false });
const Bar = dynamic(() => import('recharts').then(m=>m.Bar), { ssr:false });
const XAxis = dynamic(() => import('recharts').then(m=>m.XAxis), { ssr:false });
const YAxis = dynamic(() => import('recharts').then(m=>m.YAxis), { ssr:false });
const Tooltip = dynamic(() => import('recharts').then(m=>m.Tooltip), { ssr:false });
const CartesianGrid = dynamic(() => import('recharts').then(m=>m.CartesianGrid), { ssr:false });
const Legend = dynamic(() => import('recharts').then(m=>m.Legend), { ssr:false });

type VolumeRow = { week: string; volume: number };
type Grouped = { seriesKeys: string[]; rows: Array<Record<string, number|string>> };

export default function ReportsPage() {
  const [userId, setUserId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'none'|'exercise'|'user'>('none');
  const [chartType, setChartType] = useState<'line'|'bar'>('line');
  const [data, setData] = useState<any>([]);

  async function load() {
    const p = new URLSearchParams();
    if (userId) p.append('userId', userId);
    if (exerciseId) p.append('exerciseId', exerciseId);
    if (startDate) p.append('startDate', startDate);
    if (endDate) p.append('endDate', endDate);

    if (groupBy === 'none') {
      const rows = await api<VolumeRow[]>(`/reports/volume?${p.toString()}`);
      setData(rows);
    } else {
      p.append('groupBy', groupBy);
      const grouped = await api<Grouped>(`/reports/volume?${p.toString()}`);
      setData(grouped);
    }
  }

  const chartData = useMemo(() => {
    if (groupBy === 'none') {
      return (data as VolumeRow[]).map(d => ({ week: d.week, volume: Number(d.volume)||0 }))
        .sort((a,b) => (a.week < b.week ? -1 : 1));
    } else {
      const g = data as Grouped;
      return g.rows.map(r => ({ ...r, ...(r as any) }));
    }
  }, [data, groupBy]);

  const seriesKeys = (groupBy === 'none') ? ['volume'] : ((data?.seriesKeys) || []);

  return (
    <div style={{ maxWidth: 960, margin:'0 auto' }}>
      <h1>Reports</h1>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <input placeholder="User ID" value={userId} onChange={e=>setUserId(e.target.value)} />
        <input placeholder="Exercise ID" value={exerciseId} onChange={e=>setExerciseId(e.target.value)} />
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
        <select value={groupBy} onChange={e=>setGroupBy(e.target.value as any)}>
          <option value="none">No Group</option>
          <option value="exercise">By Exercise</option>
          <option value="user">By User</option>
        </select>
        <select value={chartType} onChange={e=>setChartType(e.target.value as any)}>
          <option value="line">Line</option>
          <option value="bar">Bar</option>
        </select>
        <button onClick={load}>Load</button>
      </div>

      <div style={{ height: 340, border:'1px solid #eee', borderRadius:8, padding:8, marginBottom:16 }}>
        {(!chartData || chartData.length===0) ? (
          <div style={{ color:'#666', padding:12 }}>No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top:10, right:20, bottom:10, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {seriesKeys.map((k) => (
                  <Line key={k} type="monotone" dataKey={k} name={k} dot />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top:10, right:20, bottom:10, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {seriesKeys.map((k) => (
                  <Bar key={k} dataKey={k} name={k} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <table border={1} cellPadding={6} style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {groupBy === 'none' ? (<><th>Week</th><th>Volume</th></>) : (
              <>
                <th>Week</th>
                {seriesKeys.map(k=><th key={k}>{k}</th>)}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {groupBy === 'none' ? (
            (chartData as any[]).map((r,i)=>(
              <tr key={i}><td>{r.week}</td><td>{r.volume}</td></tr>
            ))
          ) : (
            (chartData as any[]).map((r:any,i:number)=>(
              <tr key={i}>
                <td>{r.week}</td>
                {seriesKeys.map(k => <td key={k}>{r[k] || 0}</td>)}
              </tr>
            ))
          )}
          {(!chartData || chartData.length===0) && (
            <tr><td colSpan={seriesKeys.length + 1} style={{ color:'#666' }}>No results</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

