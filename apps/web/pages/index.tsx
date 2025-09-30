import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Role = 'ATHLETE'|'COACH'|'ADMIN';
type User = { id: string; name: string; role: Role };

export default function Home() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function load() {
    setErr('');
    try {
      const u = await api<User|{error:string}>('/auth/me');
      if (u && (u as any).id) setMe(u as User);
      const list = await api<User[]>('/auth/users');
      setUsers(list);
    } catch (e: any) {
      setErr(`Failed to load: ${e?.message || e}`);
    }
  }

  useEffect(() => { load(); }, []);

  async function login() {
    setErr('');
    if (!name.trim()) return setErr('Please enter a name.');
    setLoading(true);
    try {
      const { user } = await api<{user:User}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() })
      });
      setMe(user);
      // refresh users so the new person appears in the list
      const list = await api<User[]>('/auth/users');
      setUsers(list);
      setName('');
    } catch (e: any) {
      setErr(`Login failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function selectUser(id: string) {
    setErr('');
    try {
      const u = await api<User>(`/auth/users/${id}`);
      setMe(u);
    } catch (e: any) {
      setErr(`Select failed: ${e?.message || e}`);
    }
  }

  async function toggleRole() {
    setErr('');
    if (!me) return setErr('No user selected.');
    setLoading(true);
    try {
      const updated = await api<User>('/auth/toggle-role', {
        method: 'POST',
        body: JSON.stringify({ id: me.id })
      });
      setMe(updated);
      // update list to reflect new role
      const list = await api<User[]>('/auth/users');
      setUsers(list);
    } catch (e: any) {
      setErr(`Toggle failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Workout App</h1>

      {err && (
        <div style={{ background: '#fee', border: '1px solid #f99', padding: 8, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <section style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom: 16 }}>
        <div>
          <label style={{ display:'block', fontSize:12, color:'#555' }}>Login / Create by name</label>
          <div style={{ display:'flex', gap:8 }}>
            <input
              placeholder="Enter name"
              value={name}
              onChange={e=>setName(e.target.value)}
            />
            <button onClick={login} disabled={loading}>Login / Create</button>
          </div>
        </div>

        <div>
          <label style={{ display:'block', fontSize:12, color:'#555' }}>Or pick an existing user</label>
          <select
            value={me?.id || ''}
            onChange={e => e.target.value && selectUser(e.target.value)}
          >
            <option value="">(select user)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div>
            {me ? <>Signed in as <b>{me.name}</b> (<code>{me.role}</code>)</> : 'Not signed in'}
          </div>
          <button onClick={toggleRole} disabled={!me || loading}>Toggle Role</button>
          <button onClick={load} disabled={loading}>Refresh</button>
        </div>
      </section>

      <p style={{ color:'#666' }}>
        Use the nav above to manage <b>Exercises</b>, log sets on the <b>Logs</b> page, and visualize progress in <b>Reports</b>.
      </p>
    </div>
  );
}

