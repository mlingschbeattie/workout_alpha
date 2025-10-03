import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import FormWrapper from "../components/FormWrapper";

type Plan = { id:string; name:string; weeks:number; days:any; createdAt:string };
type User = { id:string; name:string; role:'ATHLETE'|'COACH'|'ADMIN'; planId?:string|null };

const DEFAULT_DAYS = [
  { id: 'day1', title: 'Upper Power', exercises: [{ name: 'Med Ball Chest Pass', target: '3x5' }] },
  { id: 'day2', title: 'Lower Power', exercises: [{ name: 'Broad Jump', target: '5x3' }] },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [err, setErr] = useState('');

  // form
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState<number>(4);
  const [daysJson, setDaysJson] = useState<string>(JSON.stringify(DEFAULT_DAYS, null, 2));

  const [assignUserId, setAssignUserId] = useState('');

  const selected = useMemo(() => plans.find(p => p.id === selectedId) || null, [plans, selectedId]);

  async function load() {
    setErr('');
    try {
      const [p, u] = await Promise.all([
        api<Plan[]>('/plans'),
        api<User[]>('/auth/users'),
      ]);
      setPlans(p);
      setUsers(u);
      if (p.length && !p.find(x => x.id === selectedId)) setSelectedId(p[0].id);
    } catch (e:any) { setErr(`Failed to load: ${e?.message || e}`); }
  }
  useEffect(()=>{ load(); }, []);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setWeeks(selected.weeks);
    setDaysJson(JSON.stringify(selected.days ?? [], null, 2));
  }, [selectedId]);

  function parseDays(): any | null {
    try {
      const parsed = JSON.parse(daysJson || '[]');
      if (!Array.isArray(parsed)) throw new Error('Days must be an array');
      return parsed;
    } catch (e:any) { setErr(`Days JSON invalid: ${e?.message || e}`); return null; }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const days = parseDays(); if (!days) return;
    if (!name.trim()) return setErr('Name required');
    try {
      if (selectedId) {
        await api(`/plans/${selectedId}`, { method:'PATCH', body: JSON.stringify({ name: name.trim(), weeks: Number(weeks)||1, days }) });
      } else {
        await api('/plans', { method:'POST', body: JSON.stringify({ name: name.trim(), weeks: Number(weeks)||1, days }) });
      }
      setName(''); setWeeks(4); setDaysJson(JSON.stringify(DEFAULT_DAYS, null, 2)); setSelectedId('');
      await load();
    } catch (e:any) { setErr(`Save failed: ${e?.message || e}`); }
  }

  async function remove() {
    if (!selectedId) return setErr('Select a plan to delete.');
    if (!confirm('Delete this plan?')) return;
    await api(`/plans/${selectedId}`, { method:'DELETE' });
    setSelectedId(''); await load();
  }

  async function assign() {
    if (!selectedId || !assignUserId) return;
    await api(`/auth/users/${assignUserId}/assign-plan`, { method:'POST', body: JSON.stringify({ planId: selectedId }) });
    setAssignUserId('');
    await load();
  }
  async function unassign(uid:string) {
    await api(`/auth/users/${uid}/unassign-plan`, { method:'POST' });
    await load();
  }

  return (
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-black/70">Build blocks, edit days JSON, and assign to athletes.</p>
      </div>

      {err && <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}

      {/* Selector + actions */}
      <div className="ua-card p-4 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select className="ua-select sm:max-w-xs" value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}>
            <option value="">(new plan)</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.weeks}w</option>)}
          </select>
          <div className="flex gap-2">
            <button className="ua-btn ua-btn-ghost" onClick={()=>{ setSelectedId(''); setName(''); setWeeks(4); setDaysJson(JSON.stringify(DEFAULT_DAYS, null, 2)); }}>New</button>
            <button className="ua-btn ua-btn-primary" onClick={(e)=>save(e as any)}>{selectedId ? 'Save Changes' : 'Create Plan'}</button>
            <button className="ua-btn ua-btn-ghost" onClick={remove} disabled={!selectedId}>Delete</button>
            <button className="ua-btn ua-btn-ghost" onClick={load}>Refresh</button>
          </div>
        </div>
      </div>

      {/* Plan Editor */}
      <FormWrapper title={selectedId ? "Edit Plan" : "Create Plan"} onSubmit={save}>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="ua-input sm:col-span-2" placeholder="Plan name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input type="number" min={1} className="ua-input" placeholder="Weeks" value={weeks} onChange={(e)=>setWeeks(Number(e.target.value)||1)} />
        </div>
        <div>
          <label className="text-sm text-black/70">Days (JSON)</label>
          <textarea className="ua-textarea mt-1" rows={12} spellCheck={false} value={daysJson} onChange={(e)=>setDaysJson(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="ua-btn ua-btn-primary" type="submit">{selectedId ? 'Save Changes' : 'Create Plan'}</button>
          <button type="button" className="ua-btn ua-btn-ghost" onClick={()=>{ try { setDaysJson(JSON.stringify(JSON.parse(daysJson||'[]'), null, 2)); } catch {} }}>Pretty JSON</button>
        </div>
      </FormWrapper>

      {/* Assign */}
      <FormWrapper title="Assign to Athlete" description="Select a user and assign the selected plan.">
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="ua-select" value={assignUserId} onChange={(e)=>setAssignUserId(e.target.value)}>
            <option value="">(select user)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}{u.planId ? ' (has plan)' : ''}</option>)}
          </select>
          <button className="ua-btn ua-btn-primary sm:col-span-2" type="button" onClick={assign} disabled={!selectedId || !assignUserId}>Assign</button>
        </div>

        {selectedId && (
          <div className="mt-3">
            <div className="text-sm text-black/70 mb-1">On this plan:</div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {users.filter(u => u.planId === selectedId).map(u => (
                <li key={u.id} className="ua-card p-3 flex items-center justify-between">
                  <div>{u.name} — {u.role}</div>
                  <button className="ua-btn ua-btn-ghost" type="button" onClick={()=>unassign(u.id)}>Unassign</button>
                </li>
              ))}
              {!users.filter(u=>u.planId===selectedId).length && <li className="text-sm text-black/60">No athletes assigned.</li>}
            </ul>
          </div>
        )}
      </FormWrapper>

      {/* List */}
      <div className="ua-card p-4 mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Weeks</th>
              <th className="py-2 text-left">Created</th>
              <th className="py-2 text-left">Days</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2">
                  <a href="#" onClick={(e)=>{ e.preventDefault(); setSelectedId(p.id); }} className="text-[var(--ua-red)] hover:underline">{p.name}</a>
                </td>
                <td className="py-2">{p.weeks}</td>
                <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="py-2">{Array.isArray(p.days) ? p.days.length : 0}</td>
              </tr>
            ))}
            {!plans.length && <tr><td colSpan={4} className="py-6 text-center text-black/60">No plans yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

