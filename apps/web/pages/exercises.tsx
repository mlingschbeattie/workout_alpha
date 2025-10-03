import { useEffect, useState } from "react";
import { api } from "../lib/api";
import FormWrapper from "../components/FormWrapper";

type Exercise = { id: string; name: string; category?: string; type?: string; target?: string; createdAt?: string };

export default function ExercisesPage() {
  const [list, setList] = useState<Exercise[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", category: "power", type: "power", target: "3x5" });
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const qs = q ? `?q=${encodeURIComponent(q)}` : "";
      setList(await api<Exercise[]>(`/exercises${qs}`));
    } catch (e: any) { setErr(`Load failed: ${e?.message || e}`); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/exercises", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", category: "power", type: "power", target: "3x5" });
      await load();
    } catch (e: any) { setErr(`Create failed: ${e?.message || e}`); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this exercise?")) return;
    await api(`/exercises/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <p className="text-black/70">Create and manage your exercise library.</p>
      </div>

      {err && <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}

      <FormWrapper
        title="Add Exercise"
        description="Power, strength, or plyo—define targets like 3x5."
        onSubmit={create}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <input className="ua-input sm:col-span-2" placeholder="Name (e.g., Med Ball Chest Pass)"
                 value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="ua-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="power">Power</option>
            <option value="strength">Strength</option>
            <option value="speed">Speed</option>
          </select>
          <select className="ua-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="power">Power</option>
            <option value="strength">Strength</option>
          </select>
          <input className="ua-input sm:col-span-2" placeholder="Target (e.g., 3x5)"
                 value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          <button className="ua-btn ua-btn-primary sm:col-span-2">Create</button>
        </div>
      </FormWrapper>

      <div className="ua-card p-4 mt-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input className="ua-input" placeholder="Search name…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <div className="flex gap-2">
            <button className="ua-btn ua-btn-ghost" onClick={load}>Search</button>
            <button className="ua-btn ua-btn-ghost" onClick={()=>{setQ(""); load();}}>Clear</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Category</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Target</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} className="border-b last:border-0">
                  <td className="py-2">{x.name}</td>
                  <td className="py-2">{x.category}</td>
                  <td className="py-2">{x.type}</td>
                  <td className="py-2">{x.target}</td>
                  <td className="py-2 text-right">
                    <button className="ua-btn ua-btn-ghost" onClick={() => remove(x.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={5} className="py-6 text-center text-black/60">No exercises yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

