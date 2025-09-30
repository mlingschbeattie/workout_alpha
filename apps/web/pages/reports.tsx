import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { api, API_BASE } from '../lib/api';

// recharts (CSR only)
const ResponsiveContainer = dynamic(() => import('recharts').then(m=>m.ResponsiveContainer), { ssr:false });
const LineChart         = dynamic(() => import('recharts').then(m=>m.LineChart), { ssr:false });
const Line              = dynamic(() => import('recharts').then(m=>m.Line), { ssr:false });
const BarChart          = dynamic(() => import('recharts').then(m=>m.BarChart), { ssr:false });
const Bar               = dynamic(() => import('recharts').then(m=>m.Bar), { ssr:false });
const XAxis             = dynamic(() => import('recharts').then(m=>m.XAxis), { ssr:false });
const YAxis             = dynamic(() => import('recharts').then(m=>m.YAxis), { ssr:false });
const Tooltip           = dynamic(() => import('recharts').then(m=>m.Tooltip), { ssr:false });
const CartesianGrid     = dynamic(() => import('recharts').then(m=>m.CartesianGrid), { ssr:false });
const Legend            = dynamic(() => import('recharts').then(m=>m.Legend), { ssr:false });

// ---- Types ----
type VolumeRow = { week: string; volume: number };
type Grouped = { seriesKeys: string[]; rows: Array<Record<string, number|string>> };

type Plan = { id:string; name:string; weeks:number; days:any };
type User = { id:string; name:string; role:'ATHLETE'|'COACH'|'ADMIN'; planId?:string|null; planStartDate?:string|null; completedDates?: string[] };

// ---- Helpers ----
function parseWeekNum(w: string) {
  const m = (w || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}
function toYMD(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);
}
function daysBetweenUTC(a: Date, b: Date) {
  const ms = 24*60*60*1000;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((db - da)/ms);
}

export default function ReportsPage() {
  // filters
  const [userId, setUserId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'none'|'exercise'|'user'>('none');
  const [chartType, setChartType] = useState<'line'|'bar'>('line');

  // data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<any>([]);
  const [err, setErr] = useState('');

  // compliance snapshot (derived for selected user+plan)
  const [compliance, setCompliance] = useState<{expected:number; completed:number; pct:number} | null>(null);

  // ---- initial loads ----
  useEffect(() => {
    (async () => {
      try {
        const [p, u] = await Promise.all([
          api<Plan[]>('/plans'),
          api<User[]>('/auth/users'),
        ]);
        setPlans(p);
        setUsers(u);
      } catch (e:any) {
        setErr(`Failed to load plans/users: ${e?.message || e}`);
      }
    })();
  }, []);

  // ---- load report ----
  async function load() {
    setErr('');
    try {
      const p = new URLSearchParams();
      if (userId) p.append('userId', userId);
      if (planId) p.append('planId', planId);
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
    } catch (e:any) {
      setErr(`Failed to fetch report: ${e?.message || e}`);
      setData([]);
    }
  }

  // ---- chart data normalization ----
  const chartData = useMemo(() => {
    if (groupBy === 'none') {
      return (data as VolumeRow[])
        .map(d => ({ week: d.week, volume: Number(d.volume)||0 }))
        .sort((a,b) => parseWeekNum(a.week) - parseWeekNum(b.week));
    } else {
      const g = data as Grouped;
      return (g?.rows || []);
    }
  }, [data, groupBy]);

  const seriesKeys = (groupBy === 'none') ? ['volume'] : ((data?.seriesKeys) || []);

  // ---- CSV export (safe for JSON fallback) ----
  async function downloadCSV() {
    try {
      const p = new URLSearchParams();
      if (userId) p.append('userId', userId);
      const res = await fetch(`${API_BASE}/reports/export/csv?${p.toString()}`);

      const ctype = res.headers.get('content-type') || '';
      if (ctype.includes('text/csv')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'logs.csv';
        document.body.appendChild(a);
        a.click(); a.remove();
        URL.revokeObjectURL(url);
      } else {
        // fallback JSON
        const json = await res.json();
        console.log('CSV fallback (JSON):', json);
        alert('CSV not available; raw JSON printed to console.');
      }
    } catch (e:any) {
      console.error(e);
      alert(`Download failed: ${e?.message || e}`);
    }
  }

  // ---- compliance calc for selected user + plan ----
  useEffect(() => {
    (async () => {
      try {
        setCompliance(null);
        if (!userId) return;

        // fetch user details (has planStartDate, completedDates, planId)
        const u = await api<User>(`/auth/users/${userId}`);
        const plan = (planId
          ? plans.find(p => p.id === planId)
          : (u.planId ? plans.find(p => p.id === u.planId) : undefined)
        ) as Plan | undefined;

        if (!u || !plan || !u.planStartDate) return;

        const totalDaysInPlan = Array.isArray(plan.days) ? plan.days.length : 0;
        if (!totalDaysInPlan || !plan.weeks) return;

        const start = new Date(u.planStartDate);
        const today = new Date();
        const elapsedDays = daysBetweenUTC(start, today) + 1; // inclusive day count
        const maxDays = totalDaysInPlan * Math.max(1, plan.weeks);
        const expected = Math.max(0, Math.min(elapsedDays, maxDays));

        const compList = Array.isArray(u.completedDates) ? u.completedDates : [];
        const completed = compList.filter(d => {
          const dt = new Date(d);
          return dt >= new Date(start.getFullYear(), start.getMonth(), start.getDate())
              && dt <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }).length;

        const pct = expected > 0 ? Math.min(100, Math.max(0, Math.round((completed/expected)*100))) : 0;
        setCompliance({ expected, completed, pct });
      } catch {
        // ignore
      }
    })();
  }, [userId, planId, plans]);

  return (
    <div style={{ maxWidth: 960, margin:'0 auto' }}>
      <h1>Reports</h1>

      {err && (
        <div style={{ background:'#fee', border:'1px solid #f99', padding:8, marginBottom:12 }}>
          {err}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        {/* Convenience dropdowns */}
        <select value={userId} onChange={e=>setUserId(e.target.value)}>
          <option value="">(User ID)</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
        </select>

        <select value={planId} onChange={e=>setPlanId(e.target.value)}>
          <option value="">(Plan)</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.weeks}w)</option>)}
        </select>

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
        <button onClick={downloadCSV} disabled={!userId}>Download CSV</button>
      </div>

      {/* Compliance snapshot */}
      <div style={{ marginBottom:12, padding:10, border:'1px solid #eee', borderRadius:8 }}>
        <b>Compliance:</b>{' '}
        {userId ? (
          compliance ? (
            <>
              {compliance.completed}/{compliance.expected} days ({compliance.pct}%)
            </>
          ) : (
            <span style={{ color:'#666' }}>Select a user with a plan + start date to compute.</span>
          )
        ) : (
          <span style={{ color:'#666' }}>Select a user</span>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: 340, border:'1px solid #eee', borderRadius:8, padding:8, marginBottom:16 }}>
        {(!chartData || chartData.length===0) ? (
          <div style={{ color:'#666', padding:12 }}>No data yet. Set filters and click <b>Load</b>.</div>
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

      {/* Table */}
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

