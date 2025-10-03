import { useEffect, useState } from "react";
import { api } from "../lib/api";
import FormWrapper from "../components/FormWrapper";

type User = { id:string; name:string; role:string; planStartDate?:string|null; planId?:string|null };
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
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ exerciseId:'', exerciseName:'', date:'', setNumber:1, reps:0, weight:0, rpe:'' });

  // Plan helpers
  const [dateForPlan, setDateForPlan] = useState<string>('');
  const [suggestion, setSuggestion] = useState<SuggestedDay | null>(null);

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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return alert('Login first on Auth page');
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
    try {
      await api('/logs', { method:'POST', body: JSON.stringify(body) });
      setForm({ exerciseId:'', exerciseName:'', date:'', setNumber:1, reps:0, weight:0, rpe:'' });
      await loadLogs();
    } catch (e:any) { setErr(`Log failed: ${e?.message || e}`); }
  }

  function repsFromTarget(target?: string): number | undefined {
    if (!target) return undefined;
    const m = target.match(/(\d+)\s*x\s*(\d+)/i);
    if (m) return Number(m[2]);
    const m2 = target.match(/(\d+)/);
    return m2 ? Number(m2[1]) : undefined;
  }

  async function loadPlanSuggestion() {
    if (!me) { alert('Login first'); return; }
    const qs = dateForPlan ? `?date=${encodeURIComponent(dateForPlan)}` : '';
    const sug = await api<SuggestedDay>(`/plans/for-user/${me.id}${qs}`);
    setSuggestion(sug);
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
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Logs</h1>
        <p className="text-black/70">Quickly log sets or prefill from your assigned plan.</p>
      </div>

      {err && <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}

      {/* Plan suggestion panel */}
      <div className="ua-card p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="date" className="ua-input" value={dateForPlan} onChange={(e)=>setDateForPlan(e.target.value)} />
          <button className="ua-btn ua-btn-ghost" onClick={loadPlanSuggestion}>Load today’s plan</button>
          <a className="ua-btn ua-btn-ghost" href="/plans">Manage Plans</a>
        </div>
        {suggestion && (
          <div className="mt-4">
            {!suggestion.plan && suggestion.message && <div className="text-sm text-black/70">{suggestion.message}</div>}
            {suggestion.plan && suggestion.day && (
              <div>
                <div className="mb-2 font-medium">
                  {suggestion.plan.name} — Day {Number(suggestion.dayIndex ?? 0) + 1}: {suggestion.day.title || '(untitled)'}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(suggestion.day.exercises || []).map((ex, i) => (
                    <div key={i} className="ua-card p-3">
                      <div className="font-medium">{ex.name || 'Unnamed'}</div>
                      <div className="text-sm text-black/70">{ex.target || ''}</div>
                      <button className="ua-btn ua-btn-primary mt-2" onClick={()=>quickLogFromSuggestion(ex)}>
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

      {/* Manual log form */}
      <FormWrapper title="Add Log" onSubmit={create}>
        <div className="grid gap-3 sm:grid-cols-6">
          <select className="ua-select sm:col-span-2" value={form.exerciseId} onChange={(e)=>setForm(f=>({...f, exerciseId:e.target.value, exerciseName:''}))}>
            <option value="">(select exercise)</option>
            {exercises.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <input className="ua-input sm:col-span-2" placeholder="Or custom name" value={form.exerciseName} onChange={(e)=>setForm(f=>({...f, exerciseName:e.target.value, exerciseId:''}))} />
          <input type="date" className="ua-input" value={form.date} onChange={(e)=>setForm(f=>({...f, date:e.target.value}))} />
          <input type="number" className="ua-input" placeholder="Set #" value={form.setNumber} onChange={(e)=>setForm(f=>({...f, setNumber:Number(e.target.value)}))} />
          <input type="number" className="ua-input" placeholder="Reps" value={form.reps} onChange={(e)=>setForm(f=>({...f, reps:Number(e.target.value)}))} />
          <input type="number" className="ua-input" placeholder="Weight" value={form.weight} onChange={(e)=>setForm(f=>({...f, weight:Number(e.target.value)}))} />
          <input type="number" className="ua-input" placeholder="RPE" value={form.rpe} onChange={(e)=>setForm(f=>({...f, rpe:e.target.value}))} />
          <button className="ua-btn ua-btn-primary sm:col-span-2">Add Log</button>
        </div>
      </FormWrapper>

      {/* Table */}
      <div className="ua-card p-4 mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Exercise</th>
              <th className="py-2 text-left">Set</th>
              <th className="py-2 text-left">Reps</th>
              <th className="py-2 text-left">Weight</th>
              <th className="py-2 text-left">RPE</th>
              <th className="py-2 text-left">Volume</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l,i)=>(
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">{new Date(l.date).toLocaleDateString()}</td>
                <td className="py-2">{l.exercise?.name || l.exerciseName || "—"}</td>
                <td className="py-2">{l.setNumber}</td>
                <td className="py-2">{l.reps}</td>
                <td className="py-2">{l.weight}</td>
                <td className="py-2">{l.rpe ?? ""}</td>
                <td className="py-2">{l.volume}</td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={7} className="py-6 text-center text-black/60">No logs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

