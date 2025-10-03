import React from "react";

type Exercise = { id: string; name: string };
type Day = {
  id?: string;
  title?: string;
  exercises: { exerciseId?: string; name?: string; target?: string }[];
};

export default function ExerciseSelectorPerWeek({
  day,
  onChange,
  exercises,
  weekIndex,
  dayIndex,
}: {
  day: Day | undefined;
  onChange: (next: Day) => void;
  exercises: Exercise[];
  weekIndex: number;
  dayIndex: number;
}) {
  if (!day) return null;

  function setTitle(v: string) { onChange({ ...day, title: v }); }
  function addRow() { onChange({ ...day, exercises: [...(day.exercises||[]), {}] }); }
  function removeRow(idx: number) {
    const ex = [...(day.exercises||[])]; ex.splice(idx,1);
    onChange({ ...day, exercises: ex });
  }
  function updateRow(idx:number, patch: Partial<{exerciseId?:string; name?:string; target?:string}>) {
    const ex = [...(day.exercises||[])];
    const curr = ex[idx] || {};
    if ("exerciseId" in patch) ex[idx] = { ...curr, exerciseId: patch.exerciseId || undefined, name: "" };
    else if ("name" in patch) ex[idx] = { ...curr, name: patch.name || "", exerciseId: undefined };
    else ex[idx] = { ...curr, ...patch };
    onChange({ ...day, exercises: ex });
  }

  return (
    <div className="ua-card p-4 mt-4">
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <input
          className="ua-input sm:col-span-2"
          placeholder={`Title for Week ${weekIndex+1}, Day ${dayIndex+1}`}
          value={day.title || ""}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <button type="button" className="ua-btn ua-btn-ghost" onClick={addRow}>Add Exercise</button>
        </div>
      </div>

      <div className="grid gap-2">
        {(day.exercises || []).map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-6">
            <select
              className="ua-select sm:col-span-2"
              value={row.exerciseId || ""}
              onChange={(e)=>updateRow(i, { exerciseId: e.target.value })}
            >
              <option value="">(select exercise)</option>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <input
              className="ua-input sm:col-span-2"
              placeholder="Or custom name"
              value={row.name || ""}
              onChange={(e)=>updateRow(i, { name: e.target.value })}
            />
            <input
              className="ua-input sm:col-span-1"
              placeholder="Target (e.g., 3x5)"
              value={row.target || ""}
              onChange={(e)=>updateRow(i, { target: e.target.value })}
            />
            <div className="sm:col-span-1 flex justify-end">
              <button type="button" className="ua-btn ua-btn-ghost" onClick={()=>removeRow(i)}>Remove</button>
            </div>
          </div>
        ))}
        {(!day.exercises || day.exercises.length === 0) && (
          <div className="text-sm text-black/60">No exercises yet — add one.</div>
        )}
      </div>
    </div>
  );
}

