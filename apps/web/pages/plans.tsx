import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type Plan = { id:string; name:string; weeks:number; days:any; createdAt:string };
type User = { id:string; name:string; role:'ATHLETE'|'COACH'|'ADMIN'; planId?:string|null };

const DEFAULT_DAYS_TEMPLATE = [
  { id: 'day1', title: 'Upper Power', exercises: [{ name: 'Med Ball Chest Pass', target: '3x5' }] },
  { id: 'day2', title: 'Lower Power', exercises: [{ name: 'Broad Jump', target: '5x3' }] },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // form state
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState<number>(4);
  const [daysJson, setDaysJson] = useState<string>(JSON.stringify(DEFAULT_DAYS_TEMPLATE, null, 2));

  // NEW: users + selection for assignment
  const [users, setUsers] = useState<User[]>([]);
  const [assignUserId, setAssignUserId] = useState<string>('');

  const selected = useMemo(() => plans.find(p => p.id === selectedId) || null, [plans, selectedId]);

  async function load() {
    setErr('');
    try {
      const [list, userList] = await Promise.all([
        api<Plan[]>('/plans'),
        api<User[]>('/auth/users'),
      ]);
      setPlans(list);
      setUsers(userList);
      if (list.length && !list.find(p => p.id === selectedId)) setSelectedId(list[0].id);
    } catch (e:any) { setErr(`Failed to load: ${e?.message || e}`); }
  }
  useEffect(() => { load(); }, []);

  function hydrateFormFromSelected() {
    if (!selected) return;
    setName(selected.name);
    setWeeks(selected.weeks);
    setDaysJson(JSON.stringify(selected.days ?? [], null, 2));
  }
  useEffect(() => { hydrateFormFromSelected(); }, [selectedId]);

  function resetFormToTemplate() {
    setName(''); setWeeks(4);
    setDaysJson(JSON.stringify(DEFAULT_DAYS_TEMPLATE, null, 2));
    setSelectedId('');
  }

  function parseDaysOrError(): any | null {
    try {
      const parsed = JSON.parse(daysJson || '[]');
      if (!Array.isArray(parsed)) throw new Error('Days must be an array');
      return parsed;
    } catch (e:any) { setErr(`Days JSON invalid: ${e?.message || e}`); return null; }
  }

  async function createPlan() {
    setErr('');
    const days = parseDaysOrError(); if (!days) return;
    if (!name.trim()) return setErr('Name is required');
    setLoading(true);
    try {
      await api('/plans', { method:'POST', body: JSON.stringify({ name: name.trim(), weeks: Number(weeks)||1, days }) });
      resetFormToTemplate(); await load();
    } catch (e:any) { setErr(`Create failed: ${e?.message || e}`); }
    finally { setLoading(false); }
  }

  async function savePlan() {
    if (!selectedId) return createPlan();
    setErr('');
    const days = parseDaysOrError(); if (!days) return;
    if (!name.trim()) return setErr('Name is required');
    setLoading(true);
    try {
      await api(`/plans/${selectedId}`, { method:'PATCH', body: JSON.stringify({ name: name.trim(), weeks: Number(weeks)||1, days }) });
      await load();
    } catch (e:any) { setErr(`Save failed: ${e?.message || e}`); }
    finally { setLoading(false); }
  }

  async function deletePlan() {
    if (!selectedId) return setErr('Select a plan to delete.');
    if (!confirm('Delete this plan?')) return;
    setErr(''); setLoading(true);
    try {
      await api(`/plans/${selectedId}`, { method:'DELETE' });
      setSelectedId(''); resetFormToTemplate(); await load();
    } catch (e:any) { setErr(`Delete failed: ${e?.message || e}`); }
    finally { setLoading(false); }
  }

  // NEW: assign & unassign
  async function assignPlan() {
    if (!selectedId) return setErr('Select a plan first.');
    if (!assignUserId) return setErr('Select a user to assign.');
    setErr('');
    try {
      await api(`/auth/users/${assignUserId}/assign-plan`, {
        method:'POST', body: JSON.stringify({ planId: selectedId })
      });
      const userList = await api<User[]>('/auth/users');
      setUsers(userList);
    } catch (e:any) { setErr(`Assign failed: ${e?.message || e}`); }
  }

  async function unassignPlan(uid: string) {
    setErr('');
    try {
      await api(`/auth/users/${uid}/unassign-plan`, { method:'POST' });
      const userList = await api<User[]>('/auth/users');
      setUsers(userList);
    } catch (e:any) { setErr(`Unassign failed: ${e?.message || e}`); }
  }

  // Helpers for display
  const usersOnSelectedPlan = useMemo(() => {
    if (!selectedId) return [];
    return users.filter(u => u.planId === selectedId);
  }, [users, selectedId]);

  return (
    <div style={{ maxWidth: 1100, margin:'0 auto' }}>
      <h1>Plans</h1>

      {err && <div style={{ background:'#fee', border:'1px solid #f99', padding:8, marginBottom:12 }}>{err}</div>}

      {/* selector + actions */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:12 }}>
        <select value={selectedId} onChange={(e)=> setSelectedId(e.target.value)}>
          <option value="">(new plan)</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.weeks}w</option>)}
        </select>

        <button onClick={resetFormToTemplate}>New Plan (Template)</button>
        <button onClick={savePlan} disabled={loading}>{selectedId ? 'Save Changes' : 'Create Plan'}</button>
        <button onClick={deletePlan} disabled={!selectedId || loading}>Delete</button>
        <button onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(280px, 1fr) minmax(380px, 1.4fr)', gap:16 }}>
        <section>
          <h3>Details</h3>
          <div style={{ display:'grid', gap:8 }}>
            <label>
              <div style={{ fontSize:12, color:'#555' }}>Name</div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Fall Block A" />
            </label>
            <label>
              <div style={{ fontSize:12, color:'#555' }}>Weeks</div>
              <input type="number" value={weeks} min={1} onChange={e=>setWeeks(Number(e.target.value)||1)} />
            </label>
          </div>

          <div style={{ marginTop:12 }}>
            <button onClick={() => {
              try { setDaysJson(JSON.stringify(JSON.parse(daysJson||'[]'), null, 2)); } catch {}
            }}>Pretty Format Days JSON</button>
          </div>

          {/* NEW: Assign UI */}
          <div style={{ marginTop:24 }}>
            <h3>Assign to Athlete</h3>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <select value={assignUserId} onChange={e=>setAssignUserId(e.target.value)}>
                <option value="">(select user)</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}{u.planId ? ' (has plan)' : ''}</option>)}
              </select>
              <button onClick={assignPlan} disabled={!selectedId || !assignUserId}>Assign</button>
            </div>

            <div style={{ marginTop:8, color:'#666' }}>
              {selectedId ? (
                usersOnSelectedPlan.length ? (
                  <div>
                    <div style={{ marginBottom:4 }}>On this plan:</div>
                    <ul>
                      {usersOnSelectedPlan.map(u => (
                        <li key={u.id}>
                          {u.name} — {u.role} <button onClick={()=>unassignPlan(u.id)} style={{ marginLeft:8 }}>Unassign</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : <i>No athletes assigned to this plan.</i>
              ) : <i>Select a plan to view assignments.</i>}
            </div>
          </div>
        </section>

        <section>
          <h3>Days (JSON)</h3>
          <p style={{ color:'#666', marginTop:0 }}>Provide an array like:</p>
          <pre style={{ background:'#f9f9f9', padding:8, border:'1px solid #eee', overflow:'auto' }}>
{`[
  { "id": "day1", "title": "Upper Power", "exercises": [
    { "name": "Med Ball Chest Pass", "target": "3x5" }
  ]}
]`}
          </pre>
          <textarea
            value={daysJson}
            onChange={e=>setDaysJson(e.target.value)}
            spellCheck={false}
            rows={18}
            style={{ width:'100%', fontFamily:'ui-monospace, Menlo, monospace' }}
          />
        </section>
      </div>

      <h3 style={{ marginTop:20 }}>All Plans</h3>
      <table border={1} cellPadding={6} style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr><th>Name</th><th>Weeks</th><th>Created</th><th>Days (count)</th></tr>
        </thead>
        <tbody>
          {plans.map(p => (
            <tr key={p.id} style={{ background: p.id === selectedId ? '#f7fbff' : undefined }}>
              <td><a href="#" onClick={(e)=>{ e.preventDefault(); setSelectedId(p.id); }}>{p.name}</a></td>
              <td>{p.weeks}</td>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
              <td>{Array.isArray(p.days) ? p.days.length : 0}</td>
            </tr>
          ))}
          {!plans.length && <tr><td colSpan={4} style={{ color:'#666' }}>No plans yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

