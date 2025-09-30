import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Exercise = { id:string; name:string; category:string; type?:string|null; target?:string|null; createdAt:string };

export default function ExercisesPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [list, setList] = useState<Exercise[]>([]);
  const [form, setForm] = useState({ name:'', category:'', type:'', target:'' });

  async function load() {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    const data = await api<Exercise[]>(`/exercises?${params.toString()}`);
    setList(data);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.category) return alert('name & category required');
    await api('/exercises', { method:'POST', body: JSON.stringify(form) });
    setForm({ name:'', category:'', type:'', target:'' });
    await load();
  }
  async function remove(id:string) {
    if (!confirm('Delete exercise?')) return;
    await api(`/exercises/${id}`, { method:'DELETE' });
    await load();
  }

  return (
    <div>
      <h1>Exercises</h1>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <input placeholder="Search (q)" value={q} onChange={e=>setQ(e.target.value)} />
        <input placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} />
        <button onClick={load}>Filter</button>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
        <input placeholder="Category" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
        <input placeholder="Type" value={form.type} onChange={e=>setForm(f=>({...f, type:e.target.value}))} />
        <input placeholder="Target (e.g. 4x6)" value={form.target} onChange={e=>setForm(f=>({...f, target:e.target.value}))} />
        <button onClick={create}>Add Exercise</button>
      </div>

      <table border={1} cellPadding={6} style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th>Name</th><th>Category</th><th>Type</th><th>Target</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {list.map(e=>(
            <tr key={e.id}>
              <td>{e.name}</td>
              <td>{e.category}</td>
              <td>{e.type || ''}</td>
              <td>{e.target || ''}</td>
              <td>{new Date(e.createdAt).toLocaleString()}</td>
              <td><button onClick={()=>remove(e.id)}>Delete</button></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={6} style={{ color:'#666' }}>No exercises</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

