import { useEffect, useState } from "react";
import FormWrapper from "../components/FormWrapper";
import { api } from "../lib/api";
import Link from "next/link";

type Role = "ATHLETE" | "COACH" | "ADMIN";
type User = { id: string; name: string; role: Role };

export default function AuthPage() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const u = await api<User | { error: string }>("/auth/me");
      if ((u as any)?.id) setMe(u as User);
      setUsers(await api<User[]>("/auth/users"));
    } catch (e: any) {
      setErr(`Failed to load: ${e?.message || e}`);
    }
  }
  useEffect(() => { load(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Please enter a name.");
    setErr("");
    try {
      const { user } = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setMe(user);
      setUsers(await api<User[]>("/auth/users"));
      setName("");
    } catch (e: any) {
      setErr(`Login failed: ${e?.message || e}`);
    }
  }

  async function toggleRole() {
    if (!me) return;
    try {
      const updated = await api<User>("/auth/toggle-role", {
        method: "POST",
        body: JSON.stringify({ id: me.id }),
      });
      setMe(updated);
      setUsers(await api<User[]>("/auth/users"));
    } catch (e: any) {
      setErr(`Toggle failed: ${e?.message || e}`);
    }
  }

  return (
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-black/70">Sign in or create a user; coaches can toggle role.</p>
      </div>

      {err && <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">{err}</div>}

      <FormWrapper
        title="Sign In / Create User"
        description="Use your display name to sign in or create an account."
        onSubmit={login}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="ua-input sm:col-span-2"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="ua-btn ua-btn-primary">Continue</button>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-black/70">Or select an existing user</label>
          <select
            className="ua-select"
            value={me?.id || ""}
            onChange={(e) =>
              e.target.value && api<User>(`/auth/users/${e.target.value}`).then(setMe)
            }
          >
            <option value="">(select user)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm">
              {me ? (
                <>
                  Signed in as <b>{me.name}</b> (<code>{me.role}</code>)
                </>
              ) : (
                "Not signed in"
              )}
            </div>
            <button
              type="button"
              className="ua-btn ua-btn-ghost"
              onClick={toggleRole}
              disabled={!me}
            >
              Toggle Role
            </button>
          </div>
        </div>
      </FormWrapper>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/exercises", label: "Exercises" },
          { href: "/plans", label: "Plans" },
          { href: "/logs", label: "Logs" },
          { href: "/reports", label: "Reports" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="ua-card p-4 hover:shadow-lg transition-shadow"
          >
            <div className="mb-2 h-8 w-8 rounded-md bg-[var(--ua-red)]" />
            <div className="font-medium">{x.label}</div>
            <div className="text-sm text-black/70">Open {x.label.toLowerCase()} page</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

