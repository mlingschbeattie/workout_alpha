import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type User = { id:string; name:string; role:string; planId?:string|null; planStartDate?:string|null };
type Exercise = { id:string; name:string };

type SuggestedDay = {
  user: User;
  plan: { id:string; name:string; weeks:number } | null;
  dayIndex?: number | null;
  day?: { id?:string; title?:string; exercises?: { exerciseId?:string; name?:string; target?:string }[] } | null;
  message?: string;
};

export default function LogsPage() {
  const [me, setMe] = useState<User|null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ exerciseId:'', exerciseName:'', date:'', setNumber:1, reps:0, weight:0, rpe:'' });

  // NEW: plan helpers
  const [suggestion, setSuggestion] = useState<SuggestedDay | null>(null);
  const [dateForPlan, setDateForPlan] = useState<string>(''); // YYYY-MM-DD override

  useEffect(() => {
    api<User|any>('/auth/me').then((u:any)=>{ if (u && !u.error) setMe(u as User); });
    api<Exercise[]>('/exercises').then(setExercises);
  }, []);

  async function loadLogs() {
    if (!me) return;
    const data = await api<any[]>(`/logs?userId=${me.id}`);
    setLogs(data);
  }
  useEffect(()=>{ loadLogs(); }, [me]);

  async function createLog() {
    if (!me) return alert('Login first on Home page');
    const body:any = {
      userId: me.id,
      date: form.date || new Date().toISOString().slice(0,10),
      setNumber: Number(form.setNumber||1),
      reps: Number(form.reps||0),
      weight: Number(form.weight||0),
      rpe: form.rpe ? Number(form.rpe) : undefined,
    };
    if (form.exerciseId) body.exerciseId = form.exerciseId;
    if (form.exerciseName) body.exerciseName = form.exerciseName;
    await api('/logs', { method:'POST', body: JSON.stringify(body) });
    setForm({ exerciseId:'', exerciseName:'', date:'', setNumber:1, reps:0, weight:0, rpe:'' });
    await loadLogs();
  }

  // NEW: load today's plan suggestion
  async function loadPlanSuggestion() {
    if (!me) { alert('Login first'); return; }
    const qs = dateForPlan ? `?date=${encodeURIComponent(dateForPlan)}` : '';
    const sug = await api<SuggestedDay>(`/plans/for-user/${me.id}${qs}`);
    setSuggestion(sug);
  }

  // NEW: set plan start (coach action)
  async function setPlanStart(date: string) {
    if (!me) return;
    await api(`/auth/users/${me.id}/plan-start`, {
      method: 'POST',
      body: JSON.stringify({ date: date || null })
    });
    // refresh suggestion
    await loadPlanSuggestion();
  }

  // NEW: parse reps from "4x6" etc.
  function repsFromTarget(target?: string): number | undefined {
    if (!target) return undefined;
    const m = target.match(/(\d+)\s*x\s*(\d+)/i);
    if (m) return Number(m[2]);
    // fallback if single number present
    const m2 = target.match(/(\d+)/);
    return m2 ? Number(m2[1]) : undefined;
  }

  async function quickLogFromSuggestion(ex: { exerciseId?:string; name?:string; target?:string }) {
    if (!me) return;
    const reps = repsFromTarget(ex.target) ?? 1;
    const body:any = {
      userId: me.id,
      date: (dateForPlan || new Date().toISOString().slice(0,10)),
      setNumber: 1,
      reps,
      weight: 0,
    };
    if (ex.exerciseId) body.exerciseId = ex.exerciseId;
    if (ex.name) body.exerciseName = ex.name;
    await api('/logs', { method:'POST', body: JSON.stringify(body) });
    await loadLogs();
  }

  return (
    <div>
      <h1>Logs</h1>

      {/* Plan controls */}
      <div style={{ border:'1px solid #e5e7eb', padding:12, borderRadius:8, marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input type="date" value={dateForPlan} onChange={e=>setDateForPlan(e.target.value)} />
          <button onClick={loadPlanSuggestion}>Load today’s plan</button>
          <span style={{ color:'#666' }}>Current plan start:</span>
          <input
            type="date"
            value={me?.planStartDate ? (me.planStartDate.slice(0,10)) : ''}
            onChange={(e)=> setPlanStart(e.target.value)}
          />
        </div>

        {suggestion && (
          <div style={{ marginTop:12 }}>
            {!suggestion.plan && suggestion.message && <div style={{ color:'#666' }}>{suggestion.message}</div>}
            {suggestion.plan && suggestion.day && (
              <div>
                <div style={{ marginBottom:6 }}>
                  <b>{suggestion.plan.name}</b> — Day {Number(suggestion.dayIndex ?? 0)+1}: {suggestion.day.title || '(untitled)'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:8 }}>
                  {(suggestion.day.exercises || []).map((ex, i) => (
                    <div key={i} style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
                      <div style={{ fontWeight:600 }}>{ex.name || 'Unnamed'}</div>
                      <div style={{ color:'#666', fontSize:12 }}>{ex.target || ''}</div>
                      <button style={{ marginTop:8 }} onClick={()=>quickLogFromSuggestion(ex)}>
                        Log Set (prefill)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* manual entry */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(120px, 1fr))', gap:8, marginBottom:12 }}>
        <select value={form.exerciseId} onChange={e=>setForm(f=>({...f, exerciseId:e.target.value, exerciseName:''}))}>
          <option value="">(select exercise)</option>
          {exercises.map(x=> <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <input placeholder="Or custom name" value={form.exerciseName} onChange={e=>setForm(f=>({...f, exerciseName:e.target.value, exerciseId:''}))} />
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
        <input type="number" placeholder="Set #" value={form.setNumber} onChange={e=>setForm(f=>({...f, setNumber:Number(e.target.value)}))} />
        <input type="number" placeholder="Reps" value={form.reps} onChange={e=>setForm(f=>({...f, reps:Number(e.target.value)}))} />
        <input type="number" placeholder="Weight" value={form.weight} onChange={e=>setForm(f=>({...f, weight:Number(e.target.value)}))} />
        <input type="number" placeholder="RPE" value={form.rpe} onChange={e=>setForm(f=>({...f, rpe:e.target.value}))} />
      </div>
      <button onClick={createLog}>Add Log</button>

      <h3 style={{ marginTop:16 }}>Recent</h3>
      <table border={1} cellPadding={6} style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th>Date</th><th>Exercise</th><th>Set</th><th>Reps</th><th>Weight</th><th>RPE</th><th>Volume</th></tr></thead>
        <tbody>
          {logs.map((l,i)=>(
            <tr key={i}>
              <td>{new Date(l.date).toLocaleDateString()}</td>
              <td>{l.exercise?.name || l.exerciseName || '—'}</td>
              <td>{l.setNumber}</td>
              <td>{l.reps}</td>
              <td>{l.weight}</td>
              <td>{l.rpe ?? ''}</td>
              <td>{l.volume}</td>
            </tr>
          ))}
          {!logs.length && <tr><td colSpan={7} style={{ color:'#666' }}>No logs yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

