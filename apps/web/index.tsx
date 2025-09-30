import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type User = { id: string; name: string; role: 'ATHLETE'|'COACH'|'ADMIN' };

export default function Home() {
  const [me, setMe] = useState<User | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    api<User | {error:string}>('/auth/me').then((u:any) => {
      if (u && !('error' in u)) setMe(u as User);
    }).catch(()=>{});
  }, []);

  async function login() {
    if (!name.trim()) return;
    const { user } = await api<{user:User}>('/auth/login', { method:'POST', body: JSON.stringify({ name }) });
    setMe(user);
  }

  async function toggleRole() {
    if (!me) return;
    const updated = await api<User>('/auth/toggle-role', { method:'POST', body: JSON.stringify({ id: me.id }) });
    setMe(updated);
  }

  return (
    <div>
      <h1>Workout App</h1>
      {!me ? (
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder="Enter your name" value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={login}>Login / Create</button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div>Signed in as <b>{me.name}</b> ({me.role})</div>
          <button onClick={toggleRole}>Toggle Role</button>
        </div>
      )}
      <p style={{ color:'#666', marginTop:12 }}>Use the nav above to manage exercises, log sets, and view reports.</p>
    </div>
  );
}

