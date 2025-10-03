import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import FormWrapper from "../components/FormWrapper";
import ExerciseSelectorTemplate from "../components/ExerciseSelectorTemplate";
import ExerciseSelectorPerWeek from "../components/ExerciseSelectorPerWeek";

type Exercise = { id: string; name: string; category?: string; type?: string; target?: string };
type Plan = { id:string; name:string; weeks:number; days:any; createdAt:string };
type User = { id:string; name:string; role:'ATHLETE'|'COACH'|'ADMIN'; planId?:string|null };

function makeDay(idx: number) {
  return { id: `day${idx}`, title: `Day ${idx}`, exercises: [] as { exerciseId?: string; name?: string; target?: string }[] };
}
function clamp(n:number, min:number, max:number){ return Math.max(min, Math.min(max, n)); }
function ensureArrayDays(v:any, count=3) {
  return Array.isArray(v) && v.length ? v : Array.from({length: count}, (_,i)=>makeDay(i+1));
}
function deepClone<T>(v:T):T { return JSON.parse(JSON.stringify(v)); }

export default function PlansPage() {
  // data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // selection / errors
  const [selectedId, setSelectedId] = useState("");
  const [err, setErr] = useState("");

  // builder: common
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sameAllWeeks, setSameAllWeeks] = useState(true);

  // builder: same-all-weeks mode
  const [daysTemplate, setDaysTemplate] = useState(ensureArrayDays(null, 3));
  const [activeDayTemplate, setActiveDayTemplate] = useState(0);

  // builder: per-week mode
  const [weeksDays, setWeeksDays] = useState( [ ensureArrayDays(null, 3) ] as Array<ReturnType<typeof makeDay>[]> );
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [copyTargetWeek, setCopyTargetWeek] = useState(0);

  // assign
  const [assignUserId, setAssignUserId] = useState("");

  const selected = useMemo(() => plans.find(p => p.id === selectedId) || null, [plans, selectedId]);

  // load all
  async function loadAll() {
    setErr("");
    try {
      const [p, u, ex] = await Promise.all([
        api<Plan[]>("/plans"),
        api<User[]>("/auth/users"),
        api<Exercise[]>("/exercises"),
      ]);
      setPlans(p);
      setUsers(u);
      setExercises(ex);
      if (p.length && !p.find(x => x.id === selectedId)) setSelectedId(p[0].id);
    } catch (e:any) {
      setErr(`Failed to load: ${e?.message || e}`);
    }
  }
  useEffect(()=>{ loadAll(); }, []);

  // when selecting an existing plan
  useEffect(() => {
    if (!selected) {
      setName("");
      setWeeks(4);
      setDaysPerWeek(3);
      setSameAllWeeks(true);
      setDaysTemplate(ensureArrayDays(null, 3));
      setActiveDayTemplate(0);
      setWeeksDays([ensureArrayDays(null, 3)]);
      setActiveWeek(0);
      setActiveDay(0);
      setCopyTargetWeek(0);
      return;
    }
    setName(selected.name);
    setWeeks(selected.weeks);

    const ds = ensureArrayDays(selected.days, 3);
    const guessPerWeek = clamp(Math.min(ds.length, 7), 1, 7);
    setDaysPerWeek(guessPerWeek);

    if (ds.length <= 7) {
      // treat as template
      setSameAllWeeks(true);
      setDaysTemplate(ds);
      setActiveDayTemplate(0);
      setWeeksDays([ensureArrayDays(null, guessPerWeek)]);
      setActiveWeek(0);
      setActiveDay(0);
      setCopyTargetWeek(0);
    } else {
      // split to weeks
      setSameAllWeeks(false);
      const wk = Math.max(1, selected.weeks || 4);
      const perDay = clamp(guessPerWeek, 1, 7);
      const per: Array<ReturnType<typeof makeDay>[]> = [];
      for (let w=0; w<wk; w++) {
        const base = w*perDay;
        per.push(ds.slice(base, base+perDay).map((d, idx) => ({
          id: d.id || `w${w+1}d${idx+1}`,
          title: d.title || `Week ${w+1} — Day ${idx+1}`,
          exercises: Array.isArray(d.exercises) ? d.exercises : [],
        })));
      }
      setWeeksDays(per);
      setActiveWeek(0);
      setActiveDay(0);
      setCopyTargetWeek(0);
      setDaysTemplate(ensureArrayDays(null, perDay));
    }
  }, [selectedId]);

  // keep arrays in sync
  useEffect(() => {
    if (!sameAllWeeks) {
      setWeeksDays(prev => {
        const w = Math.max(1, weeks || 1);
        const perDay = clamp(daysPerWeek, 1, 7);
        let next = prev.map(weekDays => {
          if (weekDays.length === perDay) return weekDays;
          if (weekDays.length < perDay) {
            const grow = [...weekDays];
            for (let i=weekDays.length; i<perDay; i++) grow.push(makeDay(i+1));
            return grow;
          }
          return weekDays.slice(0, perDay);
        });
        if (next.length < w) {
          for (let i=next.length; i<w; i++) next.push(Array.from({length: perDay}, (_,j)=>makeDay(j+1)));
        } else if (next.length > w) {
          next = next.slice(0, w);
        }
        return next;
      });
      if (activeWeek > (weeks-1)) setActiveWeek(Math.max(0, weeks-1));
      if (copyTargetWeek > (weeks-1)) setCopyTargetWeek(Math.max(0, weeks-1));
      if (activeDay > (daysPerWeek-1)) setActiveDay(Math.max(0, daysPerWeek-1));
    } else {
      setDaysTemplate(prev => {
        const perDay = clamp(daysPerWeek, 1, 7);
        if (prev.length === perDay) return prev;
        if (prev.length < perDay) {
          const grow = [...prev];
          for (let i=prev.length; i<perDay; i++) grow.push(makeDay(i+1));
          return grow;
        }
        return prev.slice(0, perDay);
      });
      if (activeDayTemplate > (daysPerWeek-1)) setActiveDayTemplate(Math.max(0, daysPerWeek-1));
    }
  }, [weeks, daysPerWeek, sameAllWeeks]);

  // duplicate week helpers
  function copyWeek(src:number, dst:number) {
    setWeeksDays(ws => {
      const w = Math.max(1, weeks || 1);
      if (src<0 || dst<0 || src>=w || dst>=w) return ws;
      const next = ws.slice();
      next[dst] = deepClone(ws[src]);
      return next;
    });
  }
  function copyWeekToAll(src:number) {
    setWeeksDays(ws => {
      const w = Math.max(1, weeks || 1);
      const srcArr = ws[src];
      if (!srcArr) return ws;
      const clone = deepClone(srcArr);
      return ws.map((arr, idx) => (idx === src ? arr : deepClone(clone)));
    });
  }

  // save/delete
  async function savePlan(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!name.trim()) return setErr("Name required");

    let payloadDays: any[] = [];
    if (sameAllWeeks) {
      payloadDays = daysTemplate.map((d, idx) => ({
        id: d.id || `day${idx+1}`,
        title: d.title || `Day ${idx+1}`,
        exercises: (d.exercises || []).map(ex => ({
          exerciseId: ex.exerciseId || undefined,
          name: ex.exerciseId ? undefined : (ex.name || ""),
          target: ex.target || "",
        })),
      }));
    } else {
      payloadDays = weeksDays.flatMap((weekArr, w) =>
        weekArr.map((d, idx) => ({
          id: d.id || `w${w+1}d${idx+1}`,
          title: (d.title && d.title.trim()) ? d.title : `Week ${w+1} — Day ${idx+1}`,
          exercises: (d.exercises || []).map(ex => ({
            exerciseId: ex.exerciseId || undefined,
            name: ex.exerciseId ? undefined : (ex.name || ""),
            target: ex.target || "",
          })),
        }))
      );
    }

    const body = { name: name.trim(), weeks: Number(weeks) || 1, days: payloadDays };
    try {
      if (selectedId) await api(`/plans/${selectedId}`, { method:"PATCH", body: JSON.stringify(body) });
      else await api("/plans", { method:"POST", body: JSON.stringify(body) });
      setSelectedId("");
      await loadAll();
    } catch (e:any) {
      setErr(`Save failed: ${e?.message || e}`);
    }
  }

  async function removePlan() {
    if (!selectedId) return setErr("Select a plan to delete.");
    if (!confirm("Delete this plan?")) return;
    await api(`/plans/${selectedId}`, { method:"DELETE" });
    setSelectedId("");
    await loadAll();
  }

  // assign
  async function assign() {
    if (!selectedId || !assignUserId) return;
    await api(`/auth/users/${assignUserId}/assign-plan`, { method:"POST", body: JSON.stringify({ planId: selectedId }) });
    setAssignUserId("");
    await loadAll();
  }
  async function unassign(uid:string) {
    await api(`/auth/users/${uid}/unassign-plan`, { method:"POST" });
    await loadAll();
  }

  return (
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-black/70">Build multi-week plans. Use the toggle for same routine or per-week customization.</p>
      </div>

      {err && <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}

      {/* Selector + actions */}
      <div className="ua-card p-4 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select className="ua-select sm:max-w-xs" value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}>
            <option value="">(new plan)</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.weeks}w</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              className="ua-btn ua-btn-ghost"
              onClick={()=>{
                setSelectedId("");
                setName(""); setWeeks(4); setDaysPerWeek(3);
                setSameAllWeeks(true);
                setDaysTemplate(ensureArrayDays(null, 3));
                setActiveDayTemplate(0);
                setWeeksDays([ensureArrayDays(null, 3)]);
                setActiveWeek(0); setActiveDay(0); setCopyTargetWeek(0);
              }}
            >
              New
            </button>
            <button className="ua-btn ua-btn-primary" onClick={(e)=>savePlan(e as any)}>{selectedId ? "Save Changes" : "Create Plan"}</button>
            <button className="ua-btn ua-btn-ghost" onClick={removePlan} disabled={!selectedId}>Delete</button>
            <button className="ua-btn ua-btn-ghost" onClick={loadAll}>Refresh</button>
          </div>
        </div>
      </div>

      {/* Builder */}
      <FormWrapper title={selectedId ? "Edit Plan" : "Create Plan"} onSubmit={savePlan}>
        <div className="grid gap-3 sm:grid-cols-6 items-center">
          <input className="ua-input sm:col-span-3" placeholder="Plan name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input type="number" min={1} className="ua-input sm:col-span-1" placeholder="Weeks" value={weeks} onChange={(e)=>setWeeks(Number(e.target.value)||1)} />
          <select className="ua-select sm:col-span-2" value={daysPerWeek} onChange={(e)=>setDaysPerWeek(clamp(Number(e.target.value)||1,1,7))}>
            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days / week</option>)}
          </select>

          <label className="flex items-center gap-2 sm:col-span-6">
            <input type="checkbox" className="h-4 w-4" checked={sameAllWeeks} onChange={(e)=>setSameAllWeeks(e.target.checked)} />
            <span className="text-sm">Same routine all weeks</span>
          </label>
        </div>

        {/* MODE A — Same routine all weeks */}
        {sameAllWeeks && (
          <>
            {/* Day selector (wrap Option A) */}
            <div
              className="
                flex flex-wrap content-start gap-2 mt-4
                /* max-h-[96px] overflow-y-auto */
              "
            >
              {Array.from({ length: daysPerWeek }, (_, i) => i).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`ua-btn ${activeDayTemplate === d ? "ua-btn-primary" : "ua-btn-ghost"} basis-28 md:basis-32 grow-0 shrink-0`}
                  onClick={() => setActiveDayTemplate(d)}
                >
                  Day {d + 1}
                </button>
              ))}
            </div>

            <ExerciseSelectorTemplate
              day={daysTemplate[activeDayTemplate]}
              onChange={(nextDay) => {
                setDaysTemplate(prev => prev.map((d,i)=> i===activeDayTemplate ? nextDay : d));
              }}
              exercises={exercises}
            />
          </>
        )}

        {/* MODE B — Per-week */}
        {!sameAllWeeks && (
          <>
            {/* Week selector (wrap Option A) */}
            <div
              className="
                flex flex-wrap content-start gap-2
                /* max-h-[96px] overflow-y-auto */
              "
            >
              {Array.from({ length: Math.max(1, weeks || 1) }, (_, i) => i).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`ua-btn ${activeWeek === w ? "ua-btn-primary" : "ua-btn-ghost"} basis-28 md:basis-32 grow-0 shrink-0`}
                  onClick={() => { setActiveWeek(w); setActiveDay(0); }}
                >
                  Week {w + 1}
                </button>
              ))}
            </div>

            {/* Duplicate controls */}
            <div className="ua-card p-3 my-3 grid gap-3 sm:grid-cols-4 items-center">
              <div className="text-sm sm:col-span-4">Duplicate Week {activeWeek+1}:</div>
              <button type="button" className="ua-btn ua-btn-ghost" onClick={()=>activeWeek>0 && copyWeek(activeWeek, activeWeek-1)} disabled={activeWeek===0}>Copy → Previous</button>
              <button type="button" className="ua-btn ua-btn-ghost" onClick={()=>activeWeek<(weeks-1) && copyWeek(activeWeek, activeWeek+1)} disabled={activeWeek>=weeks-1}>Copy → Next</button>
              <div className="flex gap-2">
                <select className="ua-select" value={copyTargetWeek} onChange={(e)=>setCopyTargetWeek(Number(e.target.value))}>
                  {Array.from({length: Math.max(1, weeks||1)}, (_,i)=>i).map(i=>(
                    <option key={i} value={i}>Week {i+1}</option>
                  ))}
                </select>
                <button className="ua-btn ua-btn-ghost" type="button" onClick={()=>copyWeek(activeWeek, copyTargetWeek)} disabled={copyTargetWeek===activeWeek}>
                  Copy → Selected
                </button>
              </div>
              <button type="button" className="ua-btn ua-btn-ghost" onClick={()=>copyWeekToAll(activeWeek)}>Copy → All Remaining</button>
            </div>

            {/* Day selector (wrap Option A) */}
            <div
              className="
                flex flex-wrap content-start gap-2 mt-2
                /* max-h-[96px] overflow-y-auto */
              "
            >
              {Array.from({ length: daysPerWeek }, (_, i) => i).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`ua-btn ${activeDay === d ? "ua-btn-primary" : "ua-btn-ghost"} basis-28 md:basis-32 grow-0 shrink-0`}
                  onClick={() => setActiveDay(d)}
                >
                  Day {d + 1}
                </button>
              ))}
            </div>

            <ExerciseSelectorPerWeek
              day={weeksDays[activeWeek]?.[activeDay]}
              onChange={(nextDay)=>{
                setWeeksDays(prev => prev.map((week, wi) => {
                  if (wi !== activeWeek) return week;
                  return week.map((d, di) => di===activeDay ? nextDay : d);
                }));
              }}
              exercises={exercises}
              weekIndex={activeWeek}
              dayIndex={activeDay}
            />
          </>
        )}

        <div className="pt-3 flex gap-2">
          <button className="ua-btn ua-btn-primary" type="submit">{selectedId ? "Save Changes" : "Create Plan"}</button>
          <button type="button" className="ua-btn ua-btn-ghost">Cancel</button>
        </div>
      </FormWrapper>

      {/* Assign */}
      <FormWrapper title="Assign to Athlete" description="Select a user and assign the selected plan.">
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="ua-select" value={assignUserId} onChange={(e)=>setAssignUserId(e.target.value)}>
            <option value="">(select user)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}{u.planId ? " (has plan)" : ""}</option>)}
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

      {/* Plans table */}
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

